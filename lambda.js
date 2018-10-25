"use strict"

const banks = {
  tcb: {
    name: 'Techcombank HCMC',
    account: {
      name: 'Expiup Inc',
      number: '1111-2222-3333-4455'
    } 
  },
  vcb: {
    name: 'Vietcombank HCMC',
    account: {
      name: 'Expiup Inc',
      number: '6666-7777-8888-9900'
    }
  }
}

const aws = require('aws-sdk');
const lambda = new aws.Lambda();

function sendEmailFn(functionName) {
  return function sendEmail({recipient, customer, invoice}, callback) {

    console.log(`Sending email to ${recipient}`)

    lambda.invoke(
      {
        FunctionName: functionName,
        InvocationType: "Event",
        Payload: JSON.stringify({recipient, customer, invoice, banks}, null, 2)
      },
      function(err, data) {
        if (err) {
          console.log(err)
          callback(err)
        } else {
          console.log('Send Email success')
          callback()
        }
      }
    )

  }
}

/* create api */  

const api = {
  purchase: require('@sglearn/purchase-server'),
  enroll: require('@sglearn/enroll-server'),
  course: require('@sglearn/course-server')
}

const DatabaseAbstractor = require("database-abstractor")
const invoice = new DatabaseAbstractor();
const course = new DatabaseAbstractor();
const enroll = new DatabaseAbstractor();

invoice.use(require('@sglearn/invoicedb-dynamodb-driver')());
course.use(require('@sglearn/coursedb-dynamodb-driver')());
enroll.use(require('@sglearn/enrolldb-dynamodb-driver')());

api.purchase.useDatabase({ invoice, course, enroll })
api.enroll.useDatabase({ enroll, invoice })
api.course.useDatabase({ course })

api.purchase.helper({ sendEmail: sendEmailFn('SendEmailPurchaseOrder') })

/* create express app from api */  
const express = require('express')
const cors = require('cors')

const app = express();

app.use(cors());

app.use('/purchase', api.purchase);
app.use('/enroll', api.enroll);
app.use('/course', api.course);

/* wrap into lambda */  
const awsServerlessExpress = require('aws-serverless-express')
const server = awsServerlessExpress.createServer(app)
exports.handler = (event, context) => {
  awsServerlessExpress.proxy(server, event, context)
}
