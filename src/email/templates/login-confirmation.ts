export const loginConfirmationEmail = (name: string, code: string) => `
<body>
  <p>Hello ${name},</p>
  <br />
  <p>Welcome back to Your App,</p>
  <p>
    Here's your login code:
    <b>${code}</b>
  </p>
  <p>
    <small>This code will expire in 5 minutes.</small>
  </p>
  <br />
  <p>Best of luck,</p>
  <p>TugaScript Team</p>
</body>
`;
