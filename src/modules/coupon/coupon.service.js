import Coupon from '../../../DB/model/coupon.model.js'

export const checkCouponService = async (couponName, userId) => {
    const coupon = await Coupon.findOne({ name: couponName })
    if (!coupon)
        return {
            coupon: null,
            message: `Coupon ${couponName} not found`,
            statusCode: 404,
        }

    if (coupon.isDeleted)
        return {
            coupon: null,
            message: 'Coupon not working',
            statusCode: 404,
        }

    const currentDate = new Date()
    if (coupon.expireDate <= currentDate)
        return {
            coupon: null,
            message: 'This coupon has expired',
            statusCode: 400,
        }

    if (coupon.usedBy.includes(userId))
        return {
            coupon: null,
            message: 'Coupon already used',
            statusCode: 409,
        }

    return {
        coupon,
        message: 'success',
        statusCode: 200,
    }
}
