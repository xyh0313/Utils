/*
 * @Descripttion: 自定义map共享内存
 * @Author: xinyanhui@haier.com
 * @Date: 2022-07-27 17:38:58
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2023-02-16 18:17:59
 */

// import { mem }  from '@uhjs/core';
// import cycle from 'cycle';

const MAP_KEY_PREFIX = 'threadmap_';
const reg = /^threadmap_/;

const SET_KEY_PREFIX = 'threadset_';
const regset = /^threadset_/;


const WRAPPER_DATA_TYPE = 'wrapper_data_type';

const WRAPPER_TYPE_MAPPING = {
    'MAP': 1,
    'SET': 2,
    'ARRAY': 3
};

function formatMapToObj(strMap) {

    const obj = Object.create(null);

    for (const [key, val] of strMap) {

        obj[key] = val;

    }

    // 因为外层没有key，加上外层数据类型标识以作区分
    obj[WRAPPER_DATA_TYPE] = WRAPPER_TYPE_MAPPING.MAP;

    return obj;

}

function formatSetToObj(strSet, type) {

    let obj = Object.create(null);

    if (type === WRAPPER_TYPE_MAPPING.SET) {

        strSet = Array.from(strSet);

    }

    strSet.forEach((val, index) => {

        if (val instanceof Map) {

            obj[`${MAP_KEY_PREFIX}${index}`] = formatMapToObj(val);

        } else if (val instanceof Set) {

            obj[`${SET_KEY_PREFIX}${index}`] = formatSetToObj(val, WRAPPER_TYPE_MAPPING.SET);

        } else {

            obj[index] = val;

        }

    });

    obj = type && {
        ...obj,
        [WRAPPER_DATA_TYPE]: type
    };
    return obj;

}

export class ThreadMap {

    constructor(name) {

        this.name = name;
        this.mapKeys = new Set();
        this.size = 0;

    }

    set(key, value) {

        console.log(`【${this.name}】序列化之前：key:${this.name}_${key}, value:${JSON.stringify(value)}`);
        // value = this.deepFormatMapToObj(value); 
        value = this.stringify(value);
        console.log(`【${this.name}】序列化之后：key:${this.name}_${key}, value:${value}`);
        key = `${this.name}_${key}`;
        console.log(`【${this.name}】存之前：key:${key}, value:${value}`);
        setvar(key, value);
        console.log(`【${this.name}】存之后：key:${key}, value:${value}`);

        if (!this.mapKeys.has(key)) {

            this.mapKeys.add(key);
            this.size++;

        }

    }

    get(key) {

        if (!key) {

            return;

        }

        console.log(`【${this.name}】取之前：key:${this.name}_${key}`);
        let strJson = getvar(`${this.name}_${key}`);
        console.log(`【${this.name}】取之后：key:${this.name}_${key}, value:${strJson}`);

        try {

            if (strJson) {

                console.log(`【${this.name}】反序列化之前：key:${this.name}_${key}, value: ${strJson}`);
                // const res = this.deepFormatObjToMap(strJson); 
                const res = this.parse(strJson);
                console.log(`【${this.name}】反序列化之后：key:${this.name}_${key}, value:${JSON.stringify(res)}}`);

                return res;

            }

            console.log(`【${this.name}】未取到`);
            return;

        } catch (err) {

            console.log('err:', err);
            console.log(`【${this.name}】未取到`);
            return;

        }

    }

    [Symbol.iterator]() {

        console.log(`【${this.name}】遍历`);

        let index = 0;
        const self = this;
        const arrKeys = Array.from(self.mapKeys);
        console.log(`【${this.name}】遍历, ${JSON.stringify(arrKeys)}`);
        return {
            next: () => {

                if (index < arrKeys.length) {

                    const a = arrKeys[index++];
                    const b = self.get(a);
                    return { done: false, value: [a, b] };

                }

                return { done: true, value: undefined };

            }

        };

    }

    delete(key) {

        console.log(`【${this.name}】执行delete：${this.name}_${key}`);

        if (!key) {

            return;

        }

        key = `${this.name}_${key}`;

        // 清除维护的数组key
        if (this.mapKeys.has(key)) {

            this.mapKeys.delete(key);
            this.size--;

        }

        // 释放内存key
        freevar(key);

    }

    clear() {

        console.log(`【${this.name}】执行clear：${this.name}`);

        this.mapKeys.size > 0 && this.mapKeys.forEach(val => {

            freevar(val);

        });

        this.size = 0;

    }

    has(key) {

        console.log(`【${this.name}】${this.name}_${key}执行has`);

        if (!key) {

            return false;

        }
        // key = `${this.name}_${key}`;

        let val = this.get(key);

        if (typeof val === 'undefined' || (!Object.keys(val).length)) {

            console.log(`【${this.name}】执行has结果：false`);
            return false;

        }

        console.log(`【${this.name}】执行has结果：true`);
        return true;

    }

    stringify(value) {

        try {

            const deepJson = this.deepFormatMapToObj(value);
            return JSON.stringify(deepJson);

        } catch (err) {

            console.log(err);

            return;

        }

    }

    /**
     * @param {*} value 对象
     * @returns 返回序列化的obj
     */
    deepFormatMapToObj(value) {

        if (value instanceof Map) {

            value = formatMapToObj(value);

        }

        if (value instanceof Set) {

            value = formatSetToObj(value, WRAPPER_TYPE_MAPPING.SET);

        } else if (value instanceof Array) {

            value = formatSetToObj(value, WRAPPER_TYPE_MAPPING.ARRAY);

        }

        if (typeof value === 'object') {

            for (let i in value) {

                let obj = value[i];

                if ( obj instanceof Map) {

                    delete value[i];

                    // 区分下map的key，以方便反转识别
                    i = `${MAP_KEY_PREFIX}${i}`;
                }

                if (obj instanceof Set) {

                    delete value[i];

                    // 区分下set的key，以方便反转识别
                    i = `${SET_KEY_PREFIX}${i}`;
                }

                value[i] = this.deepFormatMapToObj(obj);

            }

            // value = JSON.stringify(value);
        }

        // else {

        //     value = JSON.stringify(value);

        // }

        return value;

    }

    parse(strJson) {

        try {
            
            const obj = JSON.parse(strJson);
            return this.deepFormatObjToMap(obj);

        } catch (err) {

            console.log(err);
            return;

        }

    }

    /**
     * @param {*} strJson json对象
     * @param {*} type 1:map 2:set
     * @returns 返回反序列化后对象
     */
    deepFormatObjToMap(strJson, type) {

        try {

            // strJson = JSON.parse(strJson);
            // let res = strJson;

            if (typeof strJson !== 'object') {

                return strJson;

            }

            let res = Array.isArray(strJson) ? [] : {};

            // 考虑本身传进来是个数组或者set类型，json对象里有个WRAPPER_DATA_TYPE 区分
            if (strJson[WRAPPER_DATA_TYPE]) {

                if (strJson[WRAPPER_DATA_TYPE] === WRAPPER_TYPE_MAPPING.ARRAY) {

                    res = [];

                } else {

                    type = strJson[WRAPPER_DATA_TYPE];

                }

                delete strJson[WRAPPER_DATA_TYPE];

            }

            switch (type) {
                case WRAPPER_TYPE_MAPPING.MAP:
                    res = new Map();
                    break;
                case WRAPPER_TYPE_MAPPING.SET:
                    res = new Set();
                    Array.isArray(res) && strJson.forEach((strObj) => {
                        this.deepFormatObjToMap(strObj);
                    })
                    break;
                default:
                    break;
            }
            for (let key in strJson) {
                let valObj = strJson[key]
                // 如果是map
                if (reg.test(key)) {
                    key = key.replace(MAP_KEY_PREFIX, '');
                    if (type === WRAPPER_TYPE_MAPPING.MAP) {
                        res.set(key, this.deepFormatObjToMap(valObj, WRAPPER_TYPE_MAPPING.MAP))
                    } else if (type === WRAPPER_TYPE_MAPPING.SET) {
                        res.add(this.deepFormatObjToMap(valObj, WRAPPER_TYPE_MAPPING.MAP))
                    } else {
                        res[key] = this.deepFormatObjToMap(valObj, WRAPPER_TYPE_MAPPING.MAP)
                    }
                    
                }
                // 如果是set
                else if (regset.test(key)) {
                    key = key.replace(SET_KEY_PREFIX, '');
                    if (type === WRAPPER_TYPE_MAPPING.MAP) {
                        res.set(key, this.deepFormatObjToMap(valObj, WRAPPER_TYPE_MAPPING.SET))
                    } else if (type === WRAPPER_TYPE_MAPPING.SET) {
                        res.add(this.deepFormatObjToMap(valObj, WRAPPER_TYPE_MAPPING.SET))
                    } else {
                        res[key] = this.deepFormatObjToMap(valObj, WRAPPER_TYPE_MAPPING.SET)
                    }
                    
                }
                // 非map、set的
                else {
                    switch(type) {
                        case WRAPPER_TYPE_MAPPING.MAP:
                            res.set(key, this.deepFormatObjToMap(valObj))
                            break;
                        case WRAPPER_TYPE_MAPPING.SET:
                            res.add(this.deepFormatObjToMap(valObj))
                            break;
                        default:
                            res[key] = this.deepFormatObjToMap(valObj);
                            break;
                    }
                }
            }

            return res;

        } catch (err) {

            return strJson;

        }

    }

}