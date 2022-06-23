import axios from 'axios';
import environment from '../Utils/environment';
const environmentData = environment();
const baseURL = environmentData.SERVER_API_URL;

export const axiosGet = (url: string) => {
    return axios.get(`${baseURL}${url}`, {headers: {
        'Content-Type': 'application/json'
    }})
}


