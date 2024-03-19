import nodemailer from 'nodemailer'

export async function sendEmail(to, subject, html) {
    const trasporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.NODEMAILER_USER,
            pass: process.env.NODEMAILER_PASS,
        },
    })

    const info = await trasporter.sendMail({
        from: `"Jamela Fashion" <${process.env.NODEMAILER_USER}>`,
        to,
        subject,
        html,
    })

    return info
}
