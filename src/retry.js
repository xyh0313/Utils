export function Retry(options = {}) {
    this._maxRetryTime = options && options.timeout || Infinity;
    this._retries = options && options.retries || 10;
    this._interval = options && options.interval || 0;
    this._cancelToken = options && options.cancelToken || null;
    this._fn = null;
    this._errors = [];
    this._attempts = 1;
    this._operationTimeoutCb = null;
    this._operationStart = null;
    this._timer = null;
    this._stoped = false;
    this._resolve;
    this._reject;

    this._cancelToken && this._cancelToken.then(() => {
        this._stoped = true
    })
}

Retry.prototype.retry = function(err) {
    this._errors.push(err);
    if(this._stoped) {
        if(this._reject) this._reject([err, this._attempts, this._errors])
        this._stoped = false
        return
    }
    if(this._retries < this._attempts) {
        this._errors.unshift(new Error('Retry max times occurred'));
        if (this._operationTimeoutCb) {
            this._operationTimeoutCb(this._attempts, this._errors);
        }
        this._reject([err, this._attempts, this._errors])
        return
    }
    var currentTime = new Date().getTime();

    if (err && currentTime - this._operationStart >= this._maxRetryTime) {
        this._errors.unshift(new Error('Retry timeout occurred'));
        if (this._operationTimeoutCb) {
            this._operationTimeoutCb(this._attempts, this._errors);
        }
        this._reject([err, this._attempts, this._errors])
        return;
    }
    this._attempts++;
    this._fn(this._attempts).then(r => {
        this._resolve([r, this._attempts, this._errors])
    }).catch(res => {
        if(this._interval && this._interval > 0) {
            setTimeout(() => {
                this.retry(res)
            }, this._interval)
        }
        else {
            this.retry(res)
        }
    })
}

Retry.prototype.start = function(fn, cb = null) {
    this._fn = fn;
    if (cb) {
        this._operationTimeoutCb = cb;
    }
    this._operationStart = new Date().getTime();
    this._fn(this._attempts).then(r => {
        this._resolve([r, this._attempts, this._errors])
    }).catch(res => {
        if(this._interval && this._interval > 0) {
            setTimeout(() => {
                this.retry(res)
            }, this._interval)
        }
        else {
            this.retry(res)
        }
    })
    return new Promise((resolve, reject) => {
        this._resolve = resolve
        this._reject = reject
    })
}

Retry.prototype.stop = function() {
    if (this._timer) {
        clearTimeout(this._timer);
    }
    this._stoped = true
};

Retry.prototype.errors = function() {
    return this._errors;
}

/**

    //cancel token兼容， 当然也可以直接调用retry.stop
    function CancelToken() {
        let cancel
        let promise = new Promise((resolve) => {
            cancel = resolve
        })
        
        return {
            cancel: cancel,
            token: promise 
        }
    }
    //STEP 1、创建token source
    let source = CancelToken()

     //创建retry对象 注意：retries 与 timeout 都设置则以最先满足的为主
     const retry = new Retry({
         retries: 13,                   //最大重试次数；不设置则无限次重试，直到成功
         interval: 0,                   //重试间隔，上次结束到下次开始的事件；不设置则立即重试不会等待
         timeout: 30000,                //最大超时时间；不是设置则无超时时间，直到成功
         cancelToken: source.token      //STEP 2、将source.token传入
     });

     //业务方法
     var rssi = 0
     function getBLEDeviceRSSI(){
         return new Promise((resolve, reject) => {
             if(rssi < 5) {
                 rssi++
                 source.cancel()      //STEP 3、任意地方调用取消
                 reject(rssi)         //失败使用 reject
             }
             else {
                 resolve(true)        //成功使用 resolve
             }
         })
     }

     //retry 具体使用，对方法进行多次重试 getBLEDeviceRSSI
     retry.start(() => {
         return getBLEDeviceRSSI()           //当前只支持一个方法，且方法使用async 返回Promise
     }).then([res, times, errors] => {
         console.log(res)
     })
     .catch([err, times, errors] => {
         console.log(err)
     })
 
 */