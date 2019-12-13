const express = require('express')
const { WebhookClient } = require('dialogflow-fulfillment')
const app = express()
const fetch = require('node-fetch')
const base64 = require('base-64')

let username = "";
let password = "";
let token = "";

app.get('/', (req, res) => res.send('online'))
app.post('/', express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res })

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
  const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/',request)
  const serverResponse = await serverReturn.json()
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
  const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/messages',request)
  const serverResponse = await serverReturn.json()
}

async function clearMessages() {
  let request = {
    method: 'DELETE',
    headers: {'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-access-token': token,},
    redirect: 'follow',
    }
  const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/messages',request)
  const serverResponse = await serverReturn.json()
}


async function getToken () {
  let request = {
    method: 'GET',
    headers: {'Content-Type': 'application/json',
              'Authorization': 'Basic '+ base64.encode(username + ':' + password)},
    redirect: 'follow'
  }

  const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/login',request)
  const serverResponse = await serverReturn.json()
  token = serverResponse.token

  return token;
}



  async function welcome () {
    agent.add('Webhook works!')
    console.log("welcome intent");
    await postMessage(agent.query, true);
    await postMessage("Welcome to WiscShop", false);
  }

  async function login () {

    username = agent.parameters.username;
    password = agent.parameters.password;

    token = await getToken();

    if (token != null) {
      agent.add('successful login for ' + username);
      await clearMessages();
      await postMessage(agent.query, true);
      await postMessage(username + " successfylly logged in", false);

    } else {
      agent.add('unsuccessful login for ' + username);
      postMessage('Sorry ' + username + ", I couldn't log you in", false);
    }
  }


  let intentMap = new Map()
  intentMap.set('Default Welcome Intent', welcome)
  intentMap.set('Login', login) 
  intentMap.set('Back', goBack)
  intentMap.set('Navigate', navigate)
  agent.handleRequest(intentMap)
})

app.listen(process.env.PORT || 8080)
