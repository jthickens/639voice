const express = require('express')
const { WebhookClient } = require('dialogflow-fulfillment')
const app = express()
const fetch = require('node-fetch')
const base64 = require('base-64')

let username = "";
let password = "";
let token = "";
let cart = [];
let categories = [];

app.get('/', (req, res) => res.send('online'))
app.post('/', express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res })


async function getPage() {
  let request = {
    method: 'GET',
    headers: {'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-access-token': token,},
    redirect: 'follow',
    }
  const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/',request);
  const serverResponse = await serverReturn.json();
  return serverResponse.page;
}

async function handleIncrement(id, increments) {
  let request = {
    method: 'POST',
    headers: {'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-access-token': token,},
    redirect: 'follow',
    }
  for (let i = 0; i < increments; i++) {
    await fetch('https://mysqlcs639.cs.wisc.edu/application/products/'+id,request);
  }
}

async function handleDecrement(id, increments) {
  let request = {
    method: 'DELETE',
    headers: {'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-access-token': token,},
    redirect: 'follow',
    }
  for (let i = 0; i < increments; i++) {
    await fetch('https://mysqlcs639.cs.wisc.edu/application/products/'+id,request);
  }
}

async function modifyCart() {
  agent.add("modify cart");
  await postMessage(agent.query, true);
  let index = agent.parameters.order;
  let number = agent.parameters.number;
  let addrm = agent.parameters.addrm;
  
  //fetch context
  await fetchCart();
  page = await getPage();
  
  //check context
  if (page != ("/"+username+"/cart")) {
    agent.add("not in cart, can't edit");
    await postMessage("You have to be in the cart to modify cart contents", false);
    return;
  } 
  //check index provided
  if (index == "") {
    await postMessage("I don't know which item to edit", false);
    return;
  }
  //check index valid
  if(index > cart.length-1) {
      await postMessage("there aren't that many items in your cart", false);
      return;
  }
  let id = cart[index].id;
  //check no add w/o number 
  if (number == "" && addrm == 'add') {
    await postMessage("I don't know how many to add", false);
    return;
  } if (number == "" && addrm == 'remove') {
      await postMessage("I'll remove this item", false);
      await handleDecrement(id, cart[index].count);
      return;  
  } 
  if (addrm == 'add') {
    await postMessage("I'll add "+number+" of the "+cart[index].name, false);
    await handleIncrement(id, number);
    return;
  }if (addrm == 'remove') {
    await postMessage("I'll remove "+number+" of the "+cart[index].name, false);
    await handleDecrement(id, number);
    return;
  }
}

  async function deleteCart() {
  agent.add("delete cart");
  await postMessage(agent.query, true);
  let request = {
    method: 'DELETE',
    headers: {'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-access-token': token,},
    redirect: 'follow',
    }
  const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/products',request);
  const serverResponse = await serverReturn.json();
  fetchCart();
  await postMessage("ok, I cleared the cart", false);
}
  
async function categoryQuery() {
  agent.add("category query");
  fetchCategories();
  await postMessage(agent.query, true);
  if (categories.length == 0) {
    await postMessage("The categories are empty", false);
  } else {
    let categoryString = '';
        for (let i = 0; i < categories.length; i++) {
          categoryString += categories[i];
          if (i < categories.length - 1) {
            categoryString += ", ";
          } else {
            categoryString + " ";
          }
        }
      await postMessage("the categories are " + categoryString, false);
  }
}  

async function fetchCategories() {
  let request = {
    method: 'GET',
    headers: {'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-access-token': token,},
    redirect: 'follow',
    }
  const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/categories	',request);
  let res = await serverReturn.json();
  categories = res.categories;
}

async function cartContents() {
    agent.add("cart contents");
    await fetchCart();
    await postMessage(agent.query, true);
     if (cart.length == 0) {
        await postMessage("your cart is empty", false);
     } else {
        let contentsString = '';
        for (let i = 0; i < cart.length; i++) {
          contentsString += cart[i].count + " " + cart[i].name;
          if (i < cart.length - 1) {
            contentsString += ", ";
          } else {
            contentsString += " ";
          }
        }
      await postMessage("your cart has " + contentsString, false);
    }
}  

async function cartCost() {
  agent.add("cart cost");
  await fetchCart();
  await postMessage(agent.query, true);
   if (cart.length == 0) {
      await postMessage("your cart is empty", false);
   } else {
     let total = 0;
     for (let i = 0; i < cart.length; i++) {
       total += cart[i].price * cart[i].count;
     }
    await postMessage("your cart total is $" + total, false);
  }
}

async function cartItemNumber() {
  agent.add("cart items query");
  await fetchCart();
  await postMessage(agent.query, true);
  if (cart.length == 0) {
     await postMessage("your cart is empty", false);
  } else {
    let cartItems = 0;
    let total = 0;
     for (let i = 0; i < cart.length; i++) {
       total += 1 * cart[i].count;
     }
    await postMessage("there are " + total + " items in your cart", false);
  }
}

async function fetchCart() {
  let request = {
    method: 'GET',
    headers: {'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-access-token': token,},
    redirect: 'follow',
    }
  const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/products',request);
  let res = await serverReturn.json();
  cart = res.products;
}


async function navigate() {
  let loc = '/'+username+'/';
  let page = agent.parameters.page;
  if (page != "home") {
    loc = loc + page;
  }
  agent.add('nav to: ' + loc);
  await postMessage(agent.query, true);
  await postMessage("ok, going to " + page, false);

  let request = {
    method: 'PUT',
    headers: {'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-access-token': token,},
    redirect: 'follow',
    body: JSON.stringify({
      page: loc,
      })
    }
  const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/',request)
  const serverResponse = await serverReturn.json()
}

async function goBack () {
  await postMessage(agent.query, true);
  await postMessage("ok, going back", false);

  let request = {
    method: 'PUT',
    headers: {'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-access-token': token,},
    redirect: 'follow',
    body: JSON.stringify({
      back: true,
      })
    }
  const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/',request);
  const serverResponse = await serverReturn.json();
}

async function postMessage(postMessage, postIsUser) {
  let request = {
    method: 'POST',
    headers: {'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-access-token': token,},
    redirect: 'follow',
    body: JSON.stringify({
      isUser: postIsUser,
      text: postMessage,
      })
    }
  const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/messages',request);
  const serverResponse = await serverReturn.json();
}

async function clearMessages() {
  let request = {
    method: 'DELETE',
    headers: {'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-access-token': token,},
    redirect: 'follow',
    }
  const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/messages',request);
  const serverResponse = await serverReturn.json();
}


async function getToken () {
  let request = {
    method: 'GET',
    headers: {'Content-Type': 'application/json',
              'Authorization': 'Basic '+ base64.encode(username + ':' + password)},
    redirect: 'follow'
  }

  const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/login',request);
  const serverResponse = await serverReturn.json();
  token = serverResponse.token;

  return token;
}



  async function welcome () {
    agent.add("Welcome to WiscShop!");
    await postMessage(agent.query, true);
    await postMessage("Welcome to WiscShop!", false);
  }

  async function login () {

    username = agent.parameters.username;
    password = agent.parameters.password;

    token = await getToken();

    if (token != null) {
      agent.add('successful login for ' + username);
      await clearMessages();
      await postMessage(agent.query, true);
      await postMessage(username + " successfully logged in", false);

    } else {
      agent.add('unsuccessful login for ' + username);
      postMessage('Unable to log ' + username + " in", false);
    }
  }

  async function showTags() {
    await postMessage(agent.query, true);
    await postMessage("you must be in a category to see the tags", false);

    // let request = {
    //   method: 'GET',
    //   headers: {'Accept': 'application/json',
    //             'Content-Type': 'application/json',
    //             'x-access-token': token,},
    //   redirect: 'follow',
    //   }
    // const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/tags',request);
    // const serverResponse = await serverReturn.json();
    // console.log(serverResponse);

  }

  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Login', login); 
  intentMap.set('Back', goBack);
  intentMap.set('Navigate', navigate);
  intentMap.set('CartItemNumber', cartItemNumber);
  intentMap.set('CartCost', cartCost);
  intentMap.set('CartContents', cartContents);
  intentMap.set('CategoryQuery', categoryQuery);
  intentMap.set('DeleteCart', deleteCart);
  intentMap.set('ModifyCart', modifyCart);
  intentMap.set('ShowTags', showTags);
  agent.handleRequest(intentMap);
})

app.listen(process.env.PORT || 8080);
