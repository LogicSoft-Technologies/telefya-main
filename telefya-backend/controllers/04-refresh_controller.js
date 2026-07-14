const refresh_service = require("../services/04-refresh_service")

const refresh_controller = async (req, res)=>{
  
    try {
        const result  = await refresh_service(req.cookies)
        if(result.error){
            return res.status(result.status).json(result)
        }
      
        return res.status(200).json(result)
    } catch (error) {
        //console.error('Controller error:', error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error',
            status: 500,
        });
        
    }
}

module.exports = refresh_controller