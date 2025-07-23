
//It handles async errors in Express routes i.e. 400,500,200 like that
//So that no need to write try catch in controllers

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((err) => next(err))
    }
}

export {asyncHandler}


// const asyncHanler = (fn) => async(req, res, next) => {
//     try{
//         await fn(req, res, next)
//     }
//     catch(error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }