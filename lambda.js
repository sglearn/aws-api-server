"use strict"

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
