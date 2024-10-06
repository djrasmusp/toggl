import {NuxtError} from "nuxt/app";
import { z} from 'zod'
import {base64urlEncode} from "iron-webcrypto";

const invalidCredentialsError : NuxtError = createError({
    statusCode: 401,
    message: 'Invalid credentials'
})
export default defineEventHandler(async (event) => {
    const { email, password } = await readValidatedBody(event, z.object({
        email: z.string().email(),
        password: z.string().min(8),
    }).parse)

    const base64 = base64urlEncode(email + ':' + password)

    const account = await $fetch('https://api.track.toggl.com/api/v9/me', {
        method: 'get',
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${base64}`
        },
        query: {
            'with_related_data': true
        }
    })

    if (!account) {
        throw invalidCredentialsError
    }

    setResponseStatus(event, 201)

    return account
})