const nodemailer = require("nodemailer")

const mailSender = async (email, title, body) => {
  try {
    // Clean environment variables (remove comments and extra spaces)
    const host = (process.env.MAIL_HOST || "").split("#")[0].trim();
    const user = (process.env.MAIL_USER || "").split("#")[0].trim();
    const pass = (process.env.MAIL_PASS || "").split("#")[0].trim();

    let transporter = nodemailer.createTransport({
      host: host,
      auth: {
        user: user,
        pass: pass,
      },
      secure: false,
    })

    let info = await transporter.sendMail({
      from: `"Studynotion | CodeHelp" <${process.env.MAIL_USER}>`, // sender address
      to: `${email}`, // list of receivers
      subject: `${title}`, // Subject line
      html: `${body}`, // html body
    })
    console.log(info.response)
    return info
  } catch (error) {
    console.log(error.message)
    return error.message
  }
}

module.exports = mailSender
