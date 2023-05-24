const express = require("express");

const OauthRouter = express.Router();
const { google } = require("googleapis");
const OAuth = google.auth.OAuth2;

const CLIENT_ID = process.env.Client_id;
const CLIENT_SECRET = process.env.Client_secret;
const REDIRECT_URL = process.env.redirect_url;

const oauthClient = new OAuth(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

OauthRouter.get("/login", (req, res) => {
  const scope = ["https://www.googleapis.com/auth/userinfo.email"];
  const authUrl = oauthClient.generateAuthUrl({
    access_type: "offline",
    scope: scope,
  });
  res.redirect(authUrl);
});

OauthRouter.get("/callback", async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauthClient.getToken(code);
    const AccessToken = tokens.access_token;
    const RefreshToken = tokens.refresh_token;

    req.session.accessToken = AccessToken;
    req.session.refreshToken = RefreshToken;

    res.redirect("/messages/unread");
  } catch (error) {
    console.error("Error retrieving tokens:", error);
    res.status(500).send("Error retrieving tokens");
  }
});

OauthRouter.get("/profile", async (req, res) => {
  try {
    const oauth2 = google.oauth2({
      auth: oauthClient,
      version: "v2",
    });

    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    res.send(`Welcome, ${email}!`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error getting user info");
  }
});

OauthRouter.get("/messages/unread", async (req, res) => {
  res.send("Authentication Sucessfull");

  setInterval(processEmails, randomeInterval() * 1000);
});

const processEmails = async () => {
  try {
    const accessToken = req.session.accessToken;
    const oauth2Client = new OAuth(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const listMessages = async () => {
      try {
        const response = await gmail.users.messages.list({
          userId: "me",
          q: "is:unread",
        });

        const messages = response.data.messages;
        if (messages && messages.length > 0) {
          for (const message of messages) {
            const Id = message.threadId;

            const threadResponse = await gmail.users.threads.get({
              userId: "me",
              id: Id,
            });
            const threadMessages = threadResponse.data.messages;

            if (
              !threadMessages.some(
                (msg) => msg.labelIds.includes("SENT") && msg.from.me
              )
            ) {
              const reply = {
                threadId: Id,
                message: {
                  raw: "Your reply message here",
                },
              };

              await gmail.users.messages.send(reply);

              console.log("Reply sent ", Id);
            }
          }
        } else {
          console.log("No new messages");
        }
      } catch (error) {
        console.error("Error listing messages:", error);
      }
    };

    listMessages();
  } catch (error) {
    console.error("Error processing emails:", error);
  }
};

const randomeInterval = () => {
  const minimum = 45;
  const maximum = 120;
  return Math.floor(Math.random() * (maximum - minimum) + minimum);
};

module.exports = { OauthRouter };
