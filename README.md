# Email service

Plug&Play email service that can be used as a standalone web application or as an express router

## Running as a standalone application

The npm package configures an `email_service` executable. You will pass configuration options
through ENV variables. Check the configuration options below.

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

## Configuration options

All configuration options can be configured using ENV variables. If using it as an express router, then configuration variables can also be passed as an argument to this method. All ENV variables can be prefixed with `EMAIL_`. Since one value can be configured in many ways some take precedence over others. For example for the `SENDER` The value used will be the first found in this list:

- `EMAIL_SENDER` parameter passed to `createRouter()`
- `SENDER` parameter passed to `createRouter()`
- `EMAIL_SENDER` ENV variable
- `SENDER` ENV variable

This is the list of available configuration options:

| Variable | Description |
| --- | --- |
| `PORT` | Port number for the standalone application. Defaults to 3000 |
| `DEFAULT_FROM` | Default email sender if a `from` parameter is not specified |
| `DEFAULT_LANGUAGE` | Default language to be used if a `language` is not specified. Defaults to `en` |
| `EMAIL_TRANSPORT` | Third-party service to be used to send the email. Only `ses` is supported for production and `stub` for testing |
| `AWS_KEY` | AWS Key for sending emails using Amazon SES |
| `AWS_SECRET` | AWS Secret for sending emails using Amazon SES |
| `AWS_REGION` | AWS Region for sending emails using Amazon SES |
| `TEMPLATES_DIR` | Directory where templates will be found |

## Templates

The service will use the following templates:

- `{lang}/{templateName}-body-text.ejs` if available it will be used as plain text version of the message
- `{lang}/{templateName}-subject.ejs` for the email subject

For the HTML body one of these will be used:

- `{lang}/{templateName}-body-html.ejs` HTML template using [EJS](http://ejs.co)
- `{lang}/{templateName}-body-html.pug` HTML template using [PUG](https://pugjs.org)

The HTML output of the template is passed through [juice](https://github.com/Automattic/juice) for inlining the CSS styles.
