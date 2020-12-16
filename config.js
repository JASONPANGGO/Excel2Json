const styleKey = ['fontSize', 'color', 'alpha', 'stroke', 'strokeColor', 'bold', 'italic', 'enableShadow', 'shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'gradient', 'startColor', 'endColor', 'enableGlow', 'glowColor', 'glowBlur']
const gameConfigKey = ['stage', 'group', 'key', 'resource']
const booleanKey = [
    'bold',
    'italic',
    'enableShadow',
    'gradient',
    'enableGlow']
const colorKey = [
    'shadowColor',
    'startColor',
    'endColor',
    'glowColor',
    'color'
]
const args = [
    {
        name: 'src',
        def: 'lang.xlsx'
    }
]
module.exports = {
    styleKey,
    gameConfigKey,
    booleanKey,
    colorKey,
    args
}