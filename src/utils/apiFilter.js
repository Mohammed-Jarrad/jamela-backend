export const getSearchQuery = (searchQuery, ...keys) => {
    const searchObj = {}
    if (searchQuery) {
        if (keys.length > 1) {
            searchObj.$or = []
            keys.forEach((key) => {
                searchObj.$or.push({ [key]: { $regex: searchQuery, $options: 'i' } })
            })
        } else {
            searchObj[keys[0]] = { $regex: searchQuery, $options: 'i' }
        }
    }
    return searchObj
}

export const getSortQuery = (sortQuery) => {
    let sortString = ''
    if (sortQuery)
        sortString = sortQuery
            .trim()
            .split(',')
            .map((el) => el.replaceAll(' ', ''))
            .join(' ')
    else sortString = 'createdAt'
    return sortString
}
export const getSelectQuery = (selectQuery) => {
    let selectString = ''
    if (selectQuery)
        selectString = selectQuery
            .trim()
            .split(',')
            .map((el) => el.replaceAll(' ', ''))
            .join(' ')
    else selectString = ''
    return selectString
}

export const getPopulateQuery = (populateQuery, key, defaultKey = '') => {
    let populateString = defaultKey
    if (populateQuery === 'true') populateString = key
    return populateString
}

export const getFormatQuery = (requestQuery) => {
    let formattedQuery = { ...requestQuery }
    const execQueryKeys = ['page', 'limit', 'sort', 'search', 'select', 'populate', 'subselect']
    execQueryKeys.forEach((el) => delete formattedQuery[el])
    formattedQuery = JSON.parse(
        JSON.stringify(formattedQuery).replace(/\b(gte|lte|gt|lt|in|nin|eq|ne)\b/g, (match) => '$' + match)
    )
    return formattedQuery
}
