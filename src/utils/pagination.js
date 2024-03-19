export function pagination(query) {
    // Extract the page, limit, and search values from the query object
    let { page, limit } = query
    // If page is falsy or less than or equal to 0, set it to 1
    if (!page || page <= 0) page = 1
    // If limit is falsy or less than or equal to 0, set it to 5
    if (!limit || limit <= 0) limit = 5
    // Calculate the skip value based on whether search is truthy or falsy
    const skip = (page - 1) * limit
    // Return an object with the skip and limit values
    return { skip, limit }
}
