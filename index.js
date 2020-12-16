const xlsx = require('xlsx')
const fs = require('fs')
const { styleKey, gameConfigKey, booleanKey, colorKey, args } = require('./config')
const languagesJson = {
    fallbackLocale: 'en',
    languages: {}
}

function getFallbackLocale(workbook) {
    return workbook.SheetNames[0]
}

function getWorkbook(filename) {
    return xlsx.readFile(filename)
}

function getLanguageSheet(workbook) {
    const defaultLang = getFallbackLocale(workbook)
    const langSheet = xlsx.utils.sheet_to_json(workbook.Sheets[defaultLang])
    return langSheet
}

function getLanguageTypeKeys(keyMap) {
    const nonLanguageTypeKeys = [...styleKey, ...gameConfigKey]
    const languageTypeKeys = {}
    for (const [chineseKey, englishKey] of Object.entries(keyMap)) {
        if (!nonLanguageTypeKeys.includes(englishKey)) {
            languageTypeKeys[chineseKey] = englishKey
        }
    }
    return languageTypeKeys
}

function checkExistLanguageKey(key, languages) {
    const oneLanguageConfig = Object.values(languages)[0]
    if (!oneLanguageConfig || !oneLanguageConfig[key]) return false
    return true
}

function getLanguageKey(languageConfig, fallbackLocale, languageTextValue, languages) {
    let key
    // key字段的值作为key
    if (languageConfig.key) {
        key = languageConfig.key
    } else if (k = Object.keys(languageTextValue).find(languageType => languageType.match(/^en/))) {
        // en字段的值作为key
        key = languageTextValue[k]
    } else if (languageTextValue[fallbackLocale]) {
        // 兜底语言的字段的值作为key
        key = languageTextValue[fallbackLocale]
    } else {
        // 都没有的话就拿第一种语言的值
        key = Object.values(languageTextValue)[0]
    }
    let i = ''
    while (checkExistLanguageKey(key + i, languages)) {
        if (!i) i = 1
        else i++
    }
    key += i
    return key
}

function handleColorValue(value) {
    if (value && value[0] !== '#') {
        return value.split(/,|，/).map(num => Number(num))
    }
    return value
}

function handleBooleanValue(value) {
    if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') {
            return true
        }
        if (value.toLowerCase() === 'false') {
            return false
        }
    }
    return !!Number(value)
}

function resolveValueType(key, value) {
    if (colorKey.includes(key)) {
        return handleColorValue(value)
    }
    if (booleanKey.includes(key)) {
        return handleBooleanValue(value)
    }
    return value
}

function handleLanguageConfig(languageConfig) {
    delete languageConfig.key // key属性不写入languages.json
    if (languageConfig.resource && languageConfig.resource.indexOf('.') === -1) {
        languageConfig.resource = languageConfig.resource + '.png'
    }
    return languageConfig
}

/**
 * 解析单个词语的excel数据为languages.json格式的单个词语对象
 * @param {Object} rawWordData 单个词语的excel原数据，[中文键]:value
 * @param {*} fallbackLocale 兜底语言
 * @param {*} languages 将要写入languages.json的languages字段的对象
 * @param {*} languageTypeKeys 语种中英文键值对，如 {"中文":"zh-cn"}
 * @param {*} keyMap excel中的标题的中英文键值对，如 {"字号":"fontSize"}
 */
function resolveWord(rawWordData, fallbackLocale, languages, languageTypeKeys, keyMap) {
    const languageTextValue = {}
    const languageConfig = {}
    const languageStyle = {}
    for (const [chineseKey, value] of Object.entries(rawWordData)) {
        if (languageTypeKeys[chineseKey]) {
            languageTextValue[languageTypeKeys[chineseKey]] = value
        } else {
            const key = keyMap[chineseKey]
            if (styleKey.includes(key)) {
                languageStyle[key] = resolveValueType(key, value)
            } else {
                languageConfig[key] = value
            }
        }
    }
    const languageKey = getLanguageKey(languageConfig, fallbackLocale, languageTextValue, languages)
    for (const [languageType, value] of Object.entries(languageTextValue)) {
        languages[languageType][languageKey] = {
            value,
            ...handleLanguageConfig(languageConfig),
            style: {
                ...languageStyle
            }
        }
    }
}


function initLanguages(languageTypeKeys) {
    const languages = {}
    Object.values(languageTypeKeys).forEach(langType => {
        languages[langType] = {}
    })
    return languages
}

function getLanguages(keyMap, sheet, languageTypeKeys) {
    const languages = initLanguages(languageTypeKeys)
    for (const langInput of sheet) {
        resolveWord(langInput, languagesJson.fallbackLocale, languages, languageTypeKeys, keyMap)
    }
    return languages
}

function getArg(arg) {
    const { def } = args.find(config => config.name === arg)
    arg = '-' + arg
    if (process.argv.includes(arg)) {
        return process.argv[process.argv.indexOf(arg) + 1]
    } else {
        return def
    }
}

function checkHelp() {
    if (process.argv.includes('-h')) {
        console.log('lang2json -src [excel文件路径]')
        process.exit()
    }
}

(function run() {
    checkHelp()
    const filename = getArg('src')
    const workbook = getWorkbook(filename)
    const sheet = getLanguageSheet(workbook)
    const keyMap = sheet.shift() // excel中第一第二行是key的中英文
    const languageTypeKeys = getLanguageTypeKeys(keyMap)
    languagesJson.fallbackLocale = getFallbackLocale(workbook)
    languagesJson.languages = getLanguages(keyMap, sheet, languageTypeKeys)

    fs.writeFileSync('languages.json', JSON.stringify(languagesJson))
})()
