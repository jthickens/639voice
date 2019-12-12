const express = require('express')
const { WebhookClient } = require('dialogflow-fulfillment')
const app = express()
const fetch = require('node-fetch')
const base64 = require('base-64')

let username = "";
let password = "";
let token = "";

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

app.get('/', (req, res) => res.send('online'))
app.post('/', express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res })

  function welcome () {
    agent.add('jthick Webhook works!')
    console.log("welcome intent");
  }

  

  async function login () {
  
    username = agent.parameters.username;
    password = agent.parameters.password;

    token = await getToken();

    if (token != null) {
      agent.add(token)
      console.log(token);
      agent.add('successful login for ' + username + ", " + password);
      
    } else {
      agent.add('unsuccessful login for ' + username + ", " + password);
    }
  }


  let intentMap = new Map()
  intentMap.set('Default Welcome Intent', welcome)
  // You will need to declare this `Login` content in DialogFlow to make this work
  intentMap.set('Login', login) 
  agent.handleRequest(intentMap)
})

app.listen(process.env.PORT || 8080)
