export function CancelToken() {
    let cancel
    let promise = new Promise((resolve) => {
        cancel = resolve
    })
    
    return {
        cancel: cancel,
        token: promise 
    }
}