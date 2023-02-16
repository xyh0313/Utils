// export function pipe(...funcs) {
//     if (funcs.length === 0) return async (arg) => arg
//     if (funcs.length === 1) return async (arg) => (funcs[0])(arg)
//     return funcs.reduce(
//         (a, b) => async (...args) => await b(await a(...args))
//     )
// }

/**
 * 简易通用管道，支持异步
 * @param  {...any} funcs , 若最后一个设置了终止token，则可以在外部终止执行 支持cancel.token
 * @returns 可执行方法
 */
 export function pipe(...funcs) {
    let stop = false
    if (funcs.length === 0) return async (arg) => arg
    if (funcs.length === 1) return async (arg) => (funcs[0])(arg)
    if (funcs.length > 1) {
        let last = funcs[funcs.length - 1]
        if(last && last.then && typeof last !== 'function') { last.then(() => { stop = true }); funcs.pop() }
    }
    return funcs.reduce((a, b) => { return async (...args) => {let r = await a.bind(this)(...args); return await (async () => { if(stop) throw r; return await b.bind(this)(r) })()}})
}

/**
 * 通用管道，支持异步，外部注入任务
 */
export class PipeService {
    constructor(...funcs){
        this.funcs = funcs || []
    }
    ready(){
        if (this.funcs.length === 0) return async (arg) => arg
        if (this.funcs.length === 1) return async (arg) => (this.funcs[0])(arg)
        return this.funcs.reduce(
            (a, b) => async (...args) => await b(await a(...args))
        )
    }
    use(...funcs){
        this.funcs = [...this.funcs, ...funcs]
        return this
    }
    useBefore(...funcs){
        this.funcs = [...funcs, ...this.funcs]
        return this
    }
}

/**
        //简易管道
        function Test1(args){
            console.log('Test1' + args)
            return 'Test1';
        }

        function Test2(args){
            console.log(`Test2 - ${args}`)
            return `Test2 - ${args}`
        }

        async function Test3(args){
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    console.log(`Test3 - ${args}`)
                    reject(`Test3 - ${args}`)
                }, 2000);
            })
        }

        function Test4(args){
            console.log(`Test4 - ${args}`)
            return `Test4 - ${args}`
        }

        let func = pipe(Test1, Test2, Test3, Test4)

        func('==').then(res => {
            console.log("then - " + res)
        }).catch(res => {
            console.log("catch - " + res)
        })
 
 */




/**
        // 简易管道 带 终止
        // 1、定义终止Token对象
        let source = CancelToken()

        function Test1(args){
            console.log('Test1' + args)
            return 'Test1';
        }

        function Test2(args){
            // 2、在此方法中终止操作 
            
            console.log(`Test2 - ${args}`)
            return `Test2 - ${args}`
        }

        async function Test3(args){
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    console.log(`Test3 - ${args}`)
                    reject(`Test3 - ${args}`)
                }, 2000);
            })
        }

        function Test4(args){
            console.log(`Test4 - ${args}`)
            return `Test4 - ${args}`
        }

        // 3、最后一个参数，是终止Token
        let func = pipe(Test1, Test2, Test3, Test4, source.token)

        func('==').then(res => {
            console.log("then - " + res)
        }).catch(res => {
            console.log("catch - " + res)
        })
 
 */


        
/**
    通用管道实例：
        function aa(a){
             return new Promise((resolve, reject) => {
                resolve(a)
            })
        }
        function bb(a){
            return a + "bbbb"
        }
        function cc(a){
            return a + "ccccc"
        }
        function dd(d){
            return d + "dddd"
        }

        let pipe = new Pipe(aa,bb,cc)
        let compose = pipe.use(dd).ready()
        compose("aaaa").then((value) => {
            console.log(value)
        })
 */