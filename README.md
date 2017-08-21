# Email service

Email microservice that sends emails based on templates. Can be used as a standalone web service or as an express router.

## Running as a command line application

The npm package configures an `pnp-email-service` executable. You will pass configuration options
through ENV variables. Check the configuration options below.

## Running as a standalone HTTP server via API

This is the recommended method for running the microservice via API. You can ignore the `MICROSERVICE_PORT` configuration and this will spin up a server at a random port. Then you can obtain the port the server is running by calling `server.address().port`. This way the microservice is not exposed in the same port than your main application and you are sure it will run in an available port.

```javascript
const emailService = require('pnp-email-service')
const config = {
  /* Check the configuration options below */
}
const server = emailService.startServer(config, () => {
  const port = server.address().port
  console.log(`Listening on port ${port}! Send an HTTP POST to http://127.0.0.1:${port}/email/send for sending an email`)
})
```

## Running as an express router

```javascript
const emailService = require('pnp-email-service')
const config = {
  /* Check the configuration options below */
}
const router = emailService.createRouter(config)
app.use('/email', router)
```

## Invoking

Invoking the service is as simple as doing an HTTP POST request to `{baseURL}/send`. The `baseURL` depends on how you are deploying the service. For example if you are running it as an express router mounted in `/email` in a server running at `127.0.0.1:3000` the URL will be: `http(s)://127.0.0.1:3000/email/send`.

You need to send a JSON body with the following structure:

```javascript
{
  "language": "en",
  "templateName": "welcome",
  "templateOptions": {
    "user": {
      "name": "John"
    }
  },
  "emailOptions": {
    "from": "Judy <judy@example.com>",
    "to": "John <john@example.com>"
  }
}
```

If your `{lang}/{templateName}-body-html.ejs` template has this content:

```html
<style>
  h1 { color: #777 }
</style>
<h1>Welcome <%= user.name %></h1>
<p>Cheers,</p>
```

This HTML content will be sent:

```html
<h1 style="color: #777;">Welcome John</h1>
<p>Cheers,</p>
```

### Full example

The following code uses `node-fetch` as HTTP client library. It spins an HTTP server and provides a simple `sendEmail()` function:

```javascript
const fetch = require('node-fetch')
const emailService = require('pnp-email-service')
const emailServer = emailService.startServer(config)

const sendEmail = (templateName, emailOptions, templateOptions, language) => {
  const port = emailServer.address().port
  const url = `http://127.0.0.1:${port}/email/send`
  const body = { templateName, emailOptions, templateOptions, language }
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  })
}

// Example usage passing a `user` object to the template
sendEmail('welcome', { to: email }, { user })
  .then(response => console.log('Email sent'))
  .catch(err => console.error(err.stack))
```

## Configuration options

All configuration options can be configured using ENV variables. If using it as an express router, then configuration variables can also be passed as an argument to this method. All ENV variables can be prefixed with `EMAIL_`. Since one value can be configured in many ways some take precedence over others. For example for the `DEFAULT_FROM` variable the value used will be the first found following this list:

- `EMAIL_DEFAULT_FROM` parameter passed to `createRouter()` or `startServer()`
- `DEFAULT_FROM` parameter passed to `createRouter()` or `startServer()`
- `EMAIL_DEFAULT_FROM` ENV variable
- `DEFAULT_FROM` ENV variable

This is the list of available configuration options:

| Variable | Description |
| --- | --- |
| `MICROSERVICE_PORT` | Port number for the standalone application. If not specified it will run in a random port |
| `DEFAULT_FROM` | Default email sender if a `from` parameter is not specified |
| `DEFAULT_LANGUAGE` | Default language to be used if a `language` is not specified. Defaults to `en` |
| `TRANSPORT` | Third-party service to be used to send the email. Supported values: [`ses`, `sendgrid`, `postmark`, `mailgun`] for production; `stub` for testing |
| `AWS_KEY` | AWS Key for sending emails using Amazon SES |
| `AWS_SECRET` | AWS Secret for sending emails using Amazon SES |
| `AWS_REGION` | AWS Region for sending emails using Amazon SES |
| `SENDGRID_API_KEY` | API Key for sending emails when using Sendgrid |
| `POSTMARK_API_KEY` | API Key for sending emails when using Postmark |
| `MAILGUN_API_KEY` | API Key for sending emails when using Mailgun |
| `MAILGUN_DOMAIN` | Domain name from which emails are sent when using Mailgun |
| `TEMPLATES_DIR` | Absolute path to directory where templates will be found |

## Templates

The service will use the following templates:

- `{lang}/{templateName}-body-text.ejs` if available it will be used as plain text version of the message
- `{lang}/{templateName}-subject.ejs` for the email subject

For the HTML body one of these will be used:

- `{lang}/{templateName}-body-html.ejs` HTML template using [EJS](http://ejs.co)
- `{lang}/{templateName}-body-html.pug` HTML template using [PUG](https://pugjs.org)

The HTML output of the template is passed through [juice](https://github.com/Automattic/juice) for inlining the CSS styles.

## Example templates

There are a few example templates available in the `example_templates` directory of the repo.

## Testing your templates

You can test your templates from the command line using tools such as [ejs-cli](https://www.npmjs.com/package/ejs-cli). For example:

```bash
ejs-cli example_templates/en/password_reset-body-html.ejs -O '{"name":"John","action_url":"http://","operating_system":"","browser_name":"","supp
ort_url":""}' > password_reset.html
```

Or you can specify `TRANSPORT=stub`. This way no real emails will be sent and you will get the rendered templates as response when invoking the service.
