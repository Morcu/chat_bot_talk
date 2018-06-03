//Modules needed
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const _ = require('lodash')
const rp = require('request-promise')
const deepcopy = require('deepcopy')
require('dotenv').config()

//Start server service
const app = express()
app.set('port', (process.env.PORT || 5000))

// data process
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

// Paths

app.get('/', (req, res) => {
	res.sendStatus(200)
	res.send("I'm Alive")
})

//Facebook token
let token = process.env.TOKEN

let generic_template = {
	"attachment":{
		"type":"template",
		"payload":{
		"template_type":"generic",
		"elements":[
			{
			"title":"Welcome!",
			"image_url":"https://1.bp.blogspot.com/-OVMTO5GrBQ4/TtaPBiYdpsI/AAAAAAAAAYk/91GvGLITaPk/s1600/google-images.jpg",
			"subtitle":"#Tech",
			"buttons":[
				{
				"type":"web_url",
				"url":"https://google.com",
				"title":"Specs"
				},{
				"type":"postback",
				"title":"BUY Now",
				"payload":"DEVELOPER_DEFINED_PAYLOAD"
				}              
			]      
			},
			{
				"title":"Welcome!",
				"image_url":"https://1.bp.blogspot.com/-OVMTO5GrBQ4/TtaPBiYdpsI/AAAAAAAAAYk/91GvGLITaPk/s1600/google-images.jpg",
				"subtitle":"#Tech",
				"buttons":[
				  {
					"type":"web_url",
					"url":"https://google.com",
					"title":"Specs"
				  },{
					"type":"postback",
					"title":"BUY Now",
					"payload":"DEVELOPER_DEFINED_PAYLOAD"
				  }              
				]      
			  }
		]
		}
	}
}


//Facebook Path
app.get('/webhook/', (req, res) => {
	if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
		res.send(req.query['hub.challenge'])
	}
	res.send("Wrong token")
})

app.post('/webhook/', function(req, res) {
	let messaging_events = req.body.entry[0].messaging
	for (let i = 0; i < messaging_events.length; i++) {
		let event = messaging_events[i]
		let sender = event.sender.id
		if (event.message && event.message.text) {
			let text = event.message.text
            let url = process.env.LUIS_URL
            var options = { 
                uri: url + text.substring(0, 100),
                json:true
            }
            
            rp(options).then( item =>{
				console.log(item.query)
				let luis_out = item
				console.log(luis_out.topScoringIntent.intent)
				switch (luis_out.topScoringIntent.intent) {
					case 'recommend':
						//check entities

						if (!_.isEmpty(luis_out.entities)){
							
							let entity = luis_out.entities.filter( (entity) => {
								return entity.type == "dispositivos"
							}).map( (filter_ent) => {
								return filter_ent.entity
							})
							let msg = null
							if(entity[0] == 'teclados'){
								msg = deepcopy(generic_template)
								msg.attachment.payload.elements[0].title = "Corsair K95 RGB Platinium"
								msg.attachment.payload.elements[0].image_url = "https://eteknix-eteknixltd.netdna-ssl.com/wp-content/uploads/2017/02/Corsair-K95-RGB-Platinum-800x552.jpg"
								msg.attachment.payload.elements[1].title = "Razer Blackwidow X"
								msg.attachment.payload.elements[1].image_url = "https://images-na.ssl-images-amazon.com/images/G/30/aplusautomation/vendorimages/3e4f5949-c171-4234-a57f-4a77c3db148a.jpg._CB269548443__SR970,300_.jpg"
							}
							
							
							send(sender, msg)

						}

						break;
				
					default:
						break;
				}
				
                //sendText(sender, "Text echo: " + JSON.stringify(item));

            })

			//sendText(sender, "Text echo: " + text.substring(0, 100))
		}
	}
	res.sendStatus(200)
})


//Send text to facebook chat
function sendText(sender, text) {
	let messageData = {text: text}
	send(sender, messageData)
}



function send(sender, message){
	request({
		url: "https://graph.facebook.com/v2.6/me/messages",
		qs : {access_token: token},
		method: "POST",
		json: {
			recipient: {id: sender},
			message : message,
		}
	}, function(error, response, body) {
		if (error) {
			console.log("sending error")
		} else if (response.body.error) {
			console.log("response body error")
		}
	})
}

//Server listening 
app.listen(app.get('port'), function() {
	console.log("running: port " + process.env.PORT)
})



