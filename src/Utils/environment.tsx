const getConfig = () => {
    let environment = '';
    if(window.location.hostname.includes('local')){
        environment = 'development'
      }
      else if(window.location.hostname.includes('herokuapp')){
        environment = 'develop'
      }
      else{
        environment = 'production'
      } 

    if(environment == 'development') {
        return  {
            SERVER_API_URL:'http://localhost:4000',
            PUBLIC_GOOGLE_APP_ID: "1018260473455-hkb4ghou27fevbq3ndv8qremb2jm39hd.apps.googleusercontent.com",
            PUBLIC_FACEBOOK_APP_ID:792069617611842,
            PUBLIC_DOMAIN:"http://localhost:3001",
            PUBLIC_PROTOCOL:"http://"
        }
    } else if(environment ==='develop'){
      return { 
        SERVER_API_URL : 'https://og-engage-be.herokuapp.com',
        PUBLIC_GOOGLE_APP_ID: "1018260473455-hkb4ghou27fevbq3ndv8qremb2jm39hd.apps.googleusercontent.com",
        PUBLIC_FACEBOOK_APP_ID:792069617611842,
        PUBLIC_DOMAIN:"og-frontend-engage.herokuapp.com",
        PUBLIC_PROTOCOL:"https://"
    }
    }else{
        return {
            SERVER_API_URL : 'https://api-backend.outgrow.chat',
            PUBLIC_GOOGLE_APP_ID: "1018260473455-hkb4ghou27fevbq3ndv8qremb2jm39hd.apps.googleusercontent.com",
            PUBLIC_FACEBOOK_APP_ID:792069617611842,
            PUBLIC_DOMAIN:"app.outgrow.chat",
            PUBLIC_PROTOCOL:"https://"
        }
    }
}


export default getConfig;
