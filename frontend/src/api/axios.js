import axios from 'axios'

/*
Ease of use and atuo establish axios api connection
 */
//All our axios methods will be posted wiht /api at the begining
//withCredientals refers to our JWT token being parsed via httpOnly cookies -> secure against XSS kinda
const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
})
//RefreshToken stuff, basically we check if we need a new refresh and so it does not spam anything
let isRefreshing = false
//401 requests get put into here waiting for a new refresh tpoken to be created
let failedQueue = []

//We park here our 401 unresolved issue UNTIL they get resolved and we call upon our queue with NULL if resolved or with a new Error('bla bla')
const processQueue = (error) => {
    failedQueue.forEach(({ resolve, reject }) =>
        error ? reject(error) : resolve()
    )
    failedQueue = []
}

/*
To minimise pain and usffering, we auto attach any JWT token if it exists
 */
//Parse a response unless error
api.interceptors.response.use( response => response,
    async error => {
        const original = error.config

        //if the status is 401 and we are not trying to retry we will proceed with creating a new token refresh
        if (error.response?.status === 401 && !original._retry) {
            /*
            processQueue is that "someone". It's called after the refresh attempt completes — with either null (success) or an Error (failure):

        processQueue(null) — loops through every queued entry and calls resolve(). Each parked Promise unfreezes, hits its .then(), and retries its original request — now with a fresh token cookie attached.
                processQueue(new Error('Session expired')) — loops through every queued entry and calls reject(error). Each parked Promise rejects, the retry never happens, and the error propagates back to whatever called the original request.
        failedQueue = [] — the queue is wiped clean regardless of outcome, ready for the next cycle.
             */
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then(() => api(original))
            }

            original._retry = true
            isRefreshing = true

            try {
                await api.post('/auth/refresh')
                processQueue(null)
                return api(original)
            } catch {
                processQueue(new Error('Session expired'))
                window.location.href = '/'
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    })

export default api;