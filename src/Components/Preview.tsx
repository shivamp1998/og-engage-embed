import { useEffect, Fragment, useState } from "react";
import { useLocation } from 'react-router-dom';
import { axiosGet } from "../Utils/axiosHelper";
const Preview = () => {
    const location = useLocation();
    const params = new URLSearchParams(location.search)
    const previewId = params.get('botUrl');

    useEffect(()=> {
        axiosGet(`/users/questions?url=${previewId}&status=${"live"}`)
        .then((response)=> {
            console.log(response);
        })
    },[previewId])
    return <Fragment>
        <h1> Welcome to Preview </h1>
    </Fragment>
}

export default Preview;