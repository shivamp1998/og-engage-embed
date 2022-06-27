import axios from "axios";
import { useEffect, Fragment, useState } from "react";
import { useLocation } from "react-router-dom";
import { axiosGet, axiosPost } from "../Utils/axiosHelper";
import { useNavigate } from "react-router-dom";
const Preview = () => {
  const location = useLocation();
  const router = useNavigate();
  const params = new URLSearchParams(location.search);
  const previewId = params.get("botUrl");
  const [botCustomId, setBotCustomId] = useState<any>();
  const [botId, setBotId] = useState<any>();
  const [roomId, setRoomId] = useState<any>();
  const [questions, setQuestions] = useState<any>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<any>();
  const [message, setMessage] = useState<any>();
  const [allCustomVariables, setAllCustomVariables] = useState<any>();
  const userCredential = Math.floor(100000 + Math.random() * 900000);
  const [buttonVariables,setButtonVariables] = useState<any>();
  const [userReply, setUserReply] = useState<any>('');
  const [isReplyValid, setIsReplyValid] = useState(true);
  const [error,setError] = useState<any>('');
  

  

  useEffect(() => {
    if (previewId) {
      axiosGet(`/users/questions?url=${previewId}&status=${"live"}`)
        .then((response) => {
          console.log(response.data.botData.questions)  
          setQuestions(response.data.botData.questions);
          setBotCustomId(response.data.botData.botCustomId);
          setBotId(response.data.data._id);
          let currentIndex = response.data.botData.questions.findIndex(
            (x: any) => x.drawflowId === response.data.botData.startNodeId
          );
          setCurrentQuestionIndex(currentIndex);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [previewId]);

  const handleTitleVariable = (stringData:String) => {
    let userReply = "";
    let indexOfItem = 0;
    var result = "";
    let stringArray = stringData.split(" ");
    stringArray.map((item,index) => {
        if(item.startsWith('{') && item.endsWith('}')){
            indexOfItem = stringArray.indexOf(item);
            result = item.slice(1,-1);
            let data = allCustomVariables.filter((v:any) => v.name === result);
            if(data.length != 0) {
                userReply = data[0].value;
            }else{
                message.map((reply:any,replyIndex:number) => {
                    if(reply.completeData.hasVariable === true) {
                        if(reply.completeData.variableName === result) {
                            if(message[reply + 1] !== undefined) {
                                userReply = message[replyIndex + 1].text;
                            }
                        }
                    }
                })
            }
            if(result !== "") {
                stringArray[indexOfItem] = userReply;
                return stringArray.join(" ");
            }else{
                return stringData;
            }
        }
    });
    return stringArray.join(" ");
  }

  const handleSendNoReplyMessage = (title: string) => {
    axiosPost(`/liveBot/saveAnswers?botId=${botId}&roomId=${roomId}`, {
        botCustomId: botCustomId,
        nodeTitle: title,
        drawFlowId: questions[currentQuestionIndex].drawFlowId,
        userAnswer: 'No Reply',
        variableData: {},
        userCredential: { id: userCredential.toString()}
    })
  }

  const handleSendEmailNode = (sendTo: string,sendEmailDetails: any) => {
    axiosPost(`/liveBot/sendEmail`, {
        emailConfigId: sendEmailDetails.emailConfig,
        from : sendEmailDetails.from,
        sendTo: sendTo,
        subject: sendEmailDetails.content.subject,
        html: sendEmailDetails.content.body,
        botId: botId,
        botCustomId: botCustomId
    }).then((repsonse) => {})
    .catch((error) => {console.log(error)})
    .finally(() => {
        if(questions[currentQuestionIndex].outputs[0].connections != undefined) {
            let currentIndex = questions.findIndex((x:any) => questions[currentQuestionIndex].outputs[0].connections != undefined);
            setCurrentQuestionIndex(currentIndex); 
        }
    })
  }

  const handleSendMessageNode = (sendTo:string, sendSMSDetails:any) => {
    axiosPost(`/liveBot/sendSms`, {
        smsConfigId: sendSMSDetails.smsConfig,
        smsBody: sendSMSDetails.smsBody,
        botId: botId,
        botCustomId: botCustomId,
        userNumber: sendTo
    })
    .then((response) => {})
    .catch((err) => {console.log(err)})
    .finally(() => {
        if(questions[currentQuestionIndex].outputs[0].connecctions !== undefined) {
            let currentIndex = questions.findIndex((x:any) => x.drawflowId === questions[currentQuestionIndex].outputs[0].connections.node);
            setCurrentQuestionIndex(currentIndex);
        }
    })
  }
  const operators: string[] = ["+", "-", "*", "/", "^"];
  const isOperator = (data:any ) => {
        if(operators.includes(data)) {
            return true;
        }
        return false;
  }

  const findVariableData = (variable: string) => {
    let dataFound = buttonVariables.find((v:any) => v.name === variable);
    if(dataFound) {
        return dataFound.value;
    }else{
        return 0;
    }
  }

  let postfix: string[] = [];
  let stackArr: string[] = ['@'];
  let stackTop = 0;
  let stack: number[] = [];
  let resultStackTop: number = -1;

  const pop = () : string => {
    const popped_ele = stackArr[stackTop];
    stackTop--;
    return popped_ele;
  }

  const push = (e:string) => {
    stackTop ++;
    stackArr[stackTop] = e;
  }

  const getPrecedence = (operator: string) : number => {
    switch (operator) {
        case '+' : 
        case "-" :
            return 1;
        case "*" :
        case "/" :
            return 2;
        case "^" :
            return 3;
    }
    return -1;
  }
  const convertIntoPostFix = (formula: string[])=> {
    for( let i = 0 ; i< formula.length ; i++) {
        const activeElem = formula[i];
        if (isOperator(activeElem)) {
            if(activeElem === ")") {
                while(stackTop !== -1 && stackArr[stackTop] !== "(") {
                    postfix.push(pop());
                }

                pop();
            } else if (activeElem === "(") {
                push(activeElem);
            } else if (getPrecedence(activeElem) > getPrecedence(stackArr[stackTop])) {
                push(activeElem);
            } else {
                while( getPrecedence(activeElem)  <= getPrecedence(stackArr[stackTop]) && stackTop > -1) {
                    postfix.push(pop());
                }
            }
            push(activeElem);
        } else {
            postfix.push(activeElem);
        }
    }

    while(stackArr[stackTop] !== '@') {
        postfix.push(pop());
    }
    return postfix;
  }

  const popFromStack = () : number => {
    const popped_ele = stack[resultStackTop];
    resultStackTop--;
    return popped_ele;
  }

  const pushToStack = (e:number) => {
    resultStackTop++;
    stack[resultStackTop] = e;
  } 

  const calculate = (operand1: number, operand2: number, operator: string) => {
    switch(operator) {
        case '+' : 
            return operand1 + operand2;
        case '-' :
            return operand1 - operand2;
        case '*' :
            return operand1 * operand2;
        case '/' :
            return operand1 / operand2;
        case '^' :
            return operand1 ** operand2;
        default: 
            return 0;
    }
  }

  
  const evaluatePostFix = (formula: (string | number)[]) : number => {
    let result: number = 0;
    formula.forEach((element: string | number) => {
        if(typeof element === 'string' && isOperator(element)) {
            const operand1 = popFromStack();
            const operand2 = popFromStack();
            result = calculate(operand1,operand2,element); 
            pushToStack(result);
        }else if( typeof element === "number") {
            pushToStack(element);
        }
    });
    return result;
  }

  const handleCalculateResult = async (nodeData:any) => {
    let convertedFormula: any = [];
    nodeData?.resultNodeDetails.formula.map((item:any) => {
        if(isOperator(item)) {
            convertedFormula.push(item);
        }else {
            convertedFormula.push(findVariableData(item));
        }
    });
    let postFixFormula = convertIntoPostFix(convertedFormula);
    let finalResult = evaluatePostFix(postFixFormula);
    let oldVariableData = [...allCustomVariables];
    let newObj = { name: nodeData?.variableName, value: finalResult};
    oldVariableData.push(newObj);
    setAllCustomVariables(oldVariableData);

    if(questions[currentQuestionIndex].outputs[0].connections != undefined) {
        let currentIndex = questions.findIndex((x:any) => x.drawFlowId === questions[currentQuestionIndex].outputs[0].connections.node);
        setCurrentQuestionIndex(currentIndex);
    }
  }

  const getSimpleObject = (data:any,mainKey = "") => {
    let obj = {};
    const objKeys = Object.keys(data);
    objKeys.forEach((key) => {
        if(typeof data[key] !== 'object') {
            if(mainKey.length > 0) {
                obj = {...obj, [`${mainKey}.${key}`] : data[key]}
            }
            else {
                obj = {...obj, [`${key}`] : data[key]}
            }
        } else if(Array.isArray(data[key])) {
            const arr = data[key];
            const arrLen = data[key].length;

            let tempObj = convertArrayToObject(arr,key);
            
            if(mainKey.length > 0) {
                tempObj = getSimpleObject(data[key], `${mainKey}.${key}`);
            }else{
                tempObj = getSimpleObject(data[key], `${key}`);
                obj = {...obj,...tempObj};
            }
        }
    });
    return obj;
  }

  const convertArrayToObject = (arr: any,key: any) => {
    let obj:any = {};
    arr.forEach((a:any,index:number) => {
        obj[`${key}.${index}`] = a;
    })
    return obj;
  }

  const handlehitApi = async (apiNodeData: any) => {
        if(apiNodeData?.hitApiDetails !== undefined) {
            let requestType = apiNodeData?.hitApiDetails.requestType;
            let requestUrl = apiNodeData?.hitApiDetails.url;
            let data = apiNodeData?.hitApiDetails.body;
            let headers = apiNodeData?.hitApiDetails.headers;
            let queryParameters = apiNodeData?.hitApiDetails.queryParameters;
            let response:any;
            try {
                switch(requestType) {
                    case 'get' : 
                        response = await axios.get(requestUrl, {
                            headers, params: queryParameters
                        });
                     break;
                    case  'post' :
                        response = await axios.post(requestUrl,data,{
                            headers,
                            params: queryParameters
                        })
                        break;
                    case  'put' : 
                        response = await axios.put(requestUrl,data, {
                            headers,
                            params: queryParameters
                        })
                        break;
                    case 'patch' :
                        response = await axios.patch(requestUrl,data,{
                            headers,
                            params: queryParameters
                        })
                        break;
                    case 'delete' :
                        response = await axios.delete(requestUrl,{
                            headers,
                            params: queryParameters
                        })
                        break;
                    default : 
                        if(questions[currentQuestionIndex].outputs[1].connections !== undefined) {
                            let currentIndex = questions.findIndex((x:any) => x.drawflowId === questions[currentQuestionIndex].outputs[1].connections.node);
                            setCurrentQuestionIndex(currentIndex);
                        }   
                }
                let allData = getSimpleObject(response.data);
                let oldApiVariables = [...allCustomVariables];

                apiNodeData?.hitApiDetails.variables.map((item:any) => {
                    let variableName = item.name.split('.');
                    let firstItem = variableName[0].split("_").splice(-1,1).join("");
                    variableName[0] = firstItem;
                    let ItemtoSearch = variableName.join(".");
                    if(allData.hasOwnProperty(ItemtoSearch)) {
                        let allKeys = Object.keys(allData);
                        let allValues = Object.values(allData);
                        let indexOfitem = allKeys.indexOf(ItemtoSearch);
                        let obj = {
                            name: item.customName,
                            value: allValues[indexOfitem]
                        }
                        oldApiVariables.push(obj);
                    }
                });
                setAllCustomVariables(oldApiVariables);


                if(questions[currentQuestionIndex].outputs[0].connections !== undefined) {
                    let currentIndex = questions.findIndex((x:any) => x.drawFlowId === questions[currentQuestionIndex].connections.node);
                    setCurrentQuestionIndex(currentIndex);
                }

            }
            catch(err) {
                if(questions[currentQuestionIndex].outputs[1].connections !== undefined) {
                    let currentIndex = questions.findIndex((x:any) => x.drawFlowId === questions[currentQuestionIndex].outputs[1].connections.node);
                    setCurrentQuestionIndex(currentIndex);
                }
                console.log(err);
            }
        }
  }

  const handlePushNotifications = (pushNotification:any) => {

  }

  

  useEffect(() => {
    if (currentQuestionIndex !== undefined) {
        if(questions[currentQuestionIndex]?.name === 'button') {
            let optionsKeys = Object.keys(questions[currentQuestionIndex].data);
            let IndexOfTitle = optionsKeys.findIndex((key) => key === 'title');
            let optionValues = Object.values(questions[currentQuestionIndex].data);
            let title:any = "";
            let AllButtonOptions:any = [];

            questions[currentQuestionIndex].buttonDetails.buttons.map((item:any) => {
                let option = item;
                let newOptionTitle = handleTitleVariable(item.name);
                option.name = newOptionTitle;
                AllButtonOptions.push(option);
            })
            title = optionValues[IndexOfTitle];

            setMessage((prevItems:any) => [
                ...prevItems,
                {
                    author: 0,
                    timesstamp: new Date(),
                    text: title,
                    options: AllButtonOptions,
                    hasAnswered: false,
                    name: questions[currentQuestionIndex].name,
                    completeData: questions[currentQuestionIndex]
                }
            ]);
        }else if (questions[currentQuestionIndex]?.name === 'sendMessage') {
            let titleData = handleTitleVariable(questions[currentQuestionIndex]?.data?.title);
            setMessage( (prevData:any) => [
                ...prevData,
                {
                    author: 0,
                    timestamp: new Date(),
                    text: titleData,
                    name: questions[currentQuestionIndex].name,
                    hasAnswered: true,
                    completeData: questions[currentQuestionIndex]
                }
            ])
            handleSendNoReplyMessage(titleData);
            if(questions[currentQuestionIndex].outputs[0].connections !== undefined) {
                let currentIndex = questions.findIndex((x:any) => x.drawflowId === questions[currentQuestionIndex].outputs[0].connection.node);
                setCurrentQuestionIndex(currentIndex);
            }
        } else if ( questions[currentQuestionIndex]?.name === 'email' ||
                    questions[currentQuestionIndex]?.name === 'phone' ||
                    questions[currentQuestionIndex]?.name === 'username' ||
                    questions[currentQuestionIndex]?.name === 'address' || 
                    questions[currentQuestionIndex]?.name === 'ask_question'
                ) {
            if(questions[currentQuestionIndex] !== undefined) {
                let titleData = handleTitleVariable(questions[currentQuestionIndex]?.data?.title);
                setMessage((prevItems:any) => [
                    ...prevItems,
                    {
                        author: 0,
                        timestamp: new Date(),
                        title: titleData,
                        name: questions[currentQuestionIndex].name,
                        hasAnswered : false,
                        completeData: questions[currentQuestionIndex]
                    }
                ]); 
            } 
        } else if (questions[currentQuestionIndex]?.name === 'sendEmail') {
            let index = message.findIndex((x:any) =>  x.name === 'email' );
            let sendTo = "";
            let sendEmailDetails = questions[currentQuestionIndex].sendEmailDetails;
            if (message[index + 1] !== undefined) {
                sendTo = message[index + 1].text; 
            }
            handleSendEmailNode(sendTo,sendEmailDetails);
        } else if (questions[currentQuestionIndex]?.name === 'sendSMS') {
            let index = message.findIndex((x:any) => x.name === 'phone');
            let sendTo = '';
            let sendSmsDetails = questions[currentQuestionIndex].sendSmsDetails;
            if(message[index + 1] !== undefined) {
                sendTo = message[index + 1].text;
            }
            handleSendMessageNode(sendTo,sendSmsDetails);
        } else if (questions[currentQuestionIndex]?.name === 'result') {
            handleCalculateResult(questions[currentQuestionIndex]);
        } else if (questions[currentQuestionIndex]?.name === 'hitApi') {
            handlehitApi(questions[currentQuestionIndex]);
        } else if (questions[currentQuestionIndex]?.name === 'pushNotifications') {
            handlePushNotifications(questions[currentQuestionIndex].pushNotification);
            if(questions[currentQuestionIndex]?.outputs[0].connections !== undefined) {
                let currentIndex = questions.findIndex((x:any) => x.drawFlowId === questions[currentQuestionIndex].outputs[0].connections.node);
                setCurrentQuestionIndex(currentIndex);
            }
        }
    } 
  }, [currentQuestionIndex]);

  const handleUserReply = (currentIndex: number) => {
    let oldMessages = [...message];
    let indexToUpdate = message.length - 1;
    oldMessages[indexToUpdate].hasAnswered = true;
    setMessage(oldMessages);
    setMessage((prevItems:any) => [
        ...prevItems,
        {
            author: 1,
            timestamp: new Date(),
            text: userReply
        }
    ]);
    let varName = message[currentIndex].completeData.variableName !== undefined ? message[currentIndex].completeData.variableName : null;
    let variableDataToSend:any = {};
    
    if(varName !== null) {
        variableDataToSend = {
            [varName] : userReply
        }
    }

    axiosPost(`/liveBot/saveAnswers?botId=${botId}&roomId=${roomId}`, {
        botCustomId: botCustomId,
        nodeTitle: message[currentIndex].completeData.data.title,
        drawFlowId: message[currentIndex].completeData.drawFlowId,
        userAnswer: userReply,
        variableData: variableDataToSend,
        userCredential: { id: userCredential.toString()}
    })
    .then((response) => {
        if(roomId === null) {
            setRoomId(response.data.roomId);
        }
        if(questions[currentQuestionIndex].outputs[0].connections !== undefined) {
            let currentIndex = questions.findIndex((x:any) => x.drawFlowId === questions[currentQuestionIndex].outputs[0].connections.node);
            setCurrentQuestionIndex(currentIndex);
        }
    })
    setUserReply("");
  }

  const validateInputData = (inputData: any, validationType: any) => {
    if (validationType === "email") {
        setIsReplyValid(false);
        setError("Invalid Email");
        let regEmail =
          /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (regEmail.test(inputData)) {
          setIsReplyValid(true);
        }
      } else if (validationType === "phone") {
        setIsReplyValid(false);
        setError("Invalid Phone Number");
        let regPhone =
          /(\+\d{1,3}\s?)?((\(\d{3}\)\s?)|(\d{3})(\s|-?))(\d{3}(\s|-?))(\d{4})(\s?(([E|e]xt[:|.|]?)|x|X)(\s?\d+))?/g;
        if (regPhone.test(inputData)) {
          setIsReplyValid(true);
        }
      } else if (validationType === "username") {
        setIsReplyValid(false);
        setError("Invalid UserName");
        let regUsername = /^[A-Za-z_][A-Za-z\d_]*$/;
        if (regUsername.test(inputData)) {
          setIsReplyValid(true);
        }
      } else if (validationType === "address") {
        setIsReplyValid(false);
        setError("Address can not be empty");
        if (inputData !== "") {
          setIsReplyValid(true);
        }
      }
  }

  const handleButtonReply = (currentIndex:number, buttonSelected: any, buttonSelectedIndex: any) => {
    let oldMessages = [...message];
    let indexToUpdate = message.length - 1;
    oldMessages[indexToUpdate].hasAnswered = true;
    setMessage(oldMessages);

    setMessage((prevItems:any) => [
        ...prevItems,
        {
            author: 1,
            timestamp: new Date(),
            text: buttonSelected
        }
    ])

    let varName = message[currentIndex].completeData.variableName !== undefined ? message[currentIndex].completeData.variableName : null;
    let insideVarName = message[currentIndex].completeData.buttonDetails.variableName;
    const valueOfButton = message[currentIndex].completeData.buttonDetails.buttons[buttonSelectedIndex].value;
    let oldbuttonVarialbles = {...buttonVariables};
    let newObj = {
        name: message[currentIndex].completeData.buttonDetails.variableName,
        value: valueOfButton
    };
    oldbuttonVarialbles.push(newObj);
    setButtonVariables(oldbuttonVarialbles);
    let variableDatatoSend: any = {};
    if(varName !== null) {
        variableDatatoSend = {
            [varName] : buttonSelected,
            [insideVarName] : valueOfButton
        }
    }else{
        variableDatatoSend = null;
    }
        
    axiosPost(`/liveBot/saveAnswer?botId=${botId}&roomId=${roomId}`, {
        botCustomId: botCustomId,
        nodeTitle: message[currentIndex].completeData.title,
        drawFlowId: message[currentIndex].completeData.drawFlowId,
        userAnswer: buttonSelected,
        variableData: variableDatatoSend,
        userCredential: {id: userCredential.toString()} 
    })
    .then((response) => {
        if(roomId === null) {
            setRoomId(response.data.roomId);
        }
        if(message[currentIndex].completeData.outputs[buttonSelectedIndex]?.connections !== undefined) {
            let currentIndexValue = questions.findIndex((x:any) => x.drawFlowId === questions[currentQuestionIndex].ouputs[0].node)
            setCurrentQuestionIndex(currentIndexValue);
        }
    });
    setUserReply("");
  }

  const handleEnterSubmit = (e:any, currentIndex:number) => {
    if(e.key === 'Enter') {
        if(userReply != ""){
            if(isReplyValid) {
                handleUserReply(currentIndex);
            }
        }
    }
  } 


  

  return (
    <Fragment>
      <div>
      <div className="Previewthumbnail preview-head" onClick={() => router(-1)}>
        <h1>Lead Generation Bot</h1>
        <div className="middle-head-preview">
          <button>
            {" "}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.9177 0.0275879H6.08226C5.51551 0.0275879 4.97197 0.25273 4.57121 0.653486C4.17045 1.05424 3.94531 1.59778 3.94531 2.16454V17.8355C3.94531 18.4022 4.17045 18.9458 4.57121 19.3465C4.97197 19.7473 5.51551 19.9724 6.08226 19.9724H13.9177C14.4845 19.9724 15.028 19.7473 15.4288 19.3465C15.8295 18.9458 16.0547 18.4022 16.0547 17.8355V2.16454C16.0547 1.59778 15.8295 1.05424 15.4288 0.653486C15.028 0.25273 14.4845 0.0275879 13.9177 0.0275879ZM14.6301 17.8355C14.6301 18.0244 14.555 18.2056 14.4214 18.3392C14.2878 18.4728 14.1067 18.5478 13.9177 18.5478H6.08226C5.89334 18.5478 5.71216 18.4728 5.57858 18.3392C5.44499 18.2056 5.36994 18.0244 5.36994 17.8355V2.16454C5.36994 1.97562 5.44499 1.79444 5.57858 1.66085C5.71216 1.52727 5.89334 1.45222 6.08226 1.45222H6.79458C6.79458 1.64114 6.86962 1.82232 7.00321 1.9559C7.1368 2.08949 7.31798 2.16454 7.50689 2.16454H12.4931C12.682 2.16454 12.8632 2.08949 12.9968 1.9559C13.1304 1.82232 13.2054 1.64114 13.2054 1.45222H13.9177C14.1067 1.45222 14.2878 1.52727 14.4214 1.66085C14.555 1.79444 14.6301 1.97562 14.6301 2.16454V17.8355Z"
                fill="#666666"
              />
            </svg>
          </button>
          <button>
            <svg
              width="20"
              height="19"
              viewBox="0 0 20 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M0 3.37015C0 1.95733 1.14532 0.812012 2.55814 0.812012H17.4418C18.8547 0.812012 20 1.95733 20 3.37015V12.6725C20 14.0853 18.8547 15.2306 17.4418 15.2306H12.0591L12.7567 16.6259H14.6511C15.0364 16.6259 15.3488 16.9383 15.3488 17.3236C15.3488 17.7089 15.0364 18.0213 14.6511 18.0213H5.34883C4.96352 18.0213 4.65116 17.7089 4.65116 17.3236C4.65116 16.9383 4.96352 16.6259 5.34883 16.6259H7.24322L7.94089 15.2306H2.55814C1.14532 15.2306 0 14.0853 0 12.6725V3.37015ZM17.4418 13.8353H2.55814C1.91594 13.8353 1.39535 13.3147 1.39535 12.6725V3.37015C1.39535 2.72795 1.91594 2.20736 2.55814 2.20736H17.4418C18.0841 2.20736 18.6046 2.72795 18.6046 3.37015V12.6725C18.6046 13.3147 18.0841 13.8353 17.4418 13.8353Z"
                fill="white"
              />
            </svg>
          </button>
        </div>
        <div className="right-head-preview">
          <button className="close-preview-button" onClick={() => router(-1)}>
            {" "}
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.91615 5.00821L9.80995 1.11429C10.0634 0.86101 10.0634 0.451486 9.80995 0.198202C9.55667 -0.0550811 9.14715 -0.0550811 8.89386 0.198202L4.99994 4.09212L1.10614 0.198202C0.85274 -0.0550811 0.443335 -0.0550811 0.190051 0.198202C-0.0633505 0.451486 -0.0633505 0.86101 0.190051 1.11429L4.08385 5.00821L0.190051 8.90213C-0.0633505 9.15542 -0.0633505 9.56494 0.190051 9.81822C0.316278 9.94457 0.482247 10.008 0.648097 10.008C0.813947 10.008 0.979797 9.94457 1.10614 9.81822L4.99994 5.9243L8.89386 9.81822C9.02021 9.94457 9.18606 10.008 9.35191 10.008C9.51776 10.008 9.68361 9.94457 9.80995 9.81822C10.0634 9.56494 10.0634 9.15542 9.80995 8.90213L5.91615 5.00821Z"
                fill="#286B68"
              />
            </svg>{" "}
            Close Preview
          </button>
          <button className="share-button">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clip-path="url(#clip0_3152_1346)">
                <path
                  d="M4.09788 3.40037L5.37907 2.11919V8.89658C5.37907 9.06119 5.44446 9.21907 5.56086 9.33547C5.67726 9.45187 5.83514 9.51727 5.99976 9.51727C6.16437 9.51727 6.32225 9.45187 6.43865 9.33547C6.55505 9.21907 6.62045 9.06119 6.62045 8.89658V2.11919L7.90163 3.40037C7.95921 3.45826 8.02764 3.50423 8.10301 3.53563C8.17839 3.56703 8.25922 3.58325 8.34087 3.58336C8.42252 3.58347 8.50339 3.56747 8.57885 3.53627C8.65431 3.50508 8.72287 3.4593 8.78061 3.40156C8.83834 3.34383 8.88412 3.27526 8.91532 3.19981C8.94651 3.12435 8.96251 3.04348 8.9624 2.96182C8.96229 2.88017 8.94607 2.79935 8.91467 2.72397C8.88327 2.6486 8.8373 2.58016 8.77941 2.52258L6.43866 0.181807C6.38102 0.124167 6.3126 0.0784448 6.23729 0.0472502C6.16198 0.0160557 6.08127 0 5.99976 0C5.91824 0 5.83753 0.0160557 5.76222 0.0472502C5.68691 0.0784448 5.61849 0.124167 5.56085 0.181807L3.2201 2.52258C3.16221 2.58016 3.11624 2.6486 3.08484 2.72397C3.05344 2.79935 3.03722 2.88017 3.03711 2.96182C3.037 3.04348 3.053 3.12435 3.0842 3.19981C3.11539 3.27526 3.16117 3.34383 3.21891 3.40156C3.27664 3.4593 3.3452 3.50508 3.42066 3.53627C3.49612 3.56747 3.57699 3.58347 3.65864 3.58336C3.7403 3.58325 3.82112 3.56703 3.8965 3.53563C3.97187 3.50423 4.04031 3.45826 4.09788 3.40037Z"
                  fill="white"
                />
                <path
                  d="M11.3793 5.37933C11.2147 5.37933 11.0568 5.44473 10.9404 5.56113C10.824 5.67753 10.7586 5.83541 10.7586 6.00002V10.7586H1.24138V6.00002C1.24138 5.83541 1.17599 5.67753 1.05958 5.56113C0.943182 5.44473 0.785307 5.37933 0.62069 5.37933C0.456073 5.37933 0.298198 5.44473 0.181796 5.56113C0.0653939 5.67753 0 5.83541 0 6.00002V10.9655C0 11.2399 0.10899 11.503 0.302993 11.697C0.496996 11.891 0.760121 12 1.03448 12H10.9655C11.2399 12 11.503 11.891 11.697 11.697C11.891 11.503 12 11.2399 12 10.9655V6.00002C12 5.83541 11.9346 5.67753 11.8182 5.56113C11.7018 5.44473 11.5439 5.37933 11.3793 5.37933Z"
                  fill="white"
                />
              </g>
              <defs>
                <clipPath id="clip0_3152_1346">
                  <rect width="12" height="12" fill="white" />
                </clipPath>
              </defs>
            </svg>
            Share
          </button>
        </div>
      </div>
      <div className="previewContainer">
        <div className="centered-div">
          <div className="chatDataContainer">
            {/* MAP DISPLAY DATA */}
            {message?.map((msg:any, currentIndex:any) => {
              if (msg.name === "button") {
                return (
                  <div key={currentIndex}>
                    <div
                      key={currentIndex}
                      className={msg.author === 0 ? `botleft` : `userright`}
                    >
                      {msg.author === 0 ? (
                        <div className="Previewthumbnail">
                          <img
                            src="https://res.cloudinary.com/dnag1wvx8/image/upload/v1655881768/Ellipse_59_lu6dgl.svg"
                            alt=""
                          />
                        </div>
                      ) : null}
                      <div
                        className={
                          msg.author === 0 ? `botChatBox` : `userChatBox`
                        }
                      >
                        <p> {msg.text}</p>
                      </div>
                    </div>
                    <div className="buttonContainer flex-wrap">
                      {msg.options.map((value:any, index:any) =>
                        msg.hasAnswered ? null : (
                          <div key={index} className="buttonleft">
                            <div
                              className="questionButton"
                              onClick={() => {
                                handleButtonReply(
                                  currentIndex,
                                  value.name,
                                  index
                                );
                              }}
                            >
                              {value.image !== undefined ? (
                                <img src={value.image} alt="" />
                              ) : null}
                              <p> {value.name}</p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={currentIndex}>
                    <div
                      key={currentIndex}
                      className={msg.author === 0 ? `botleft` : `userright`}
                    >
                      {msg.author === 0 ? (
                        <div className="Previewthumbnail">
                          <img
                            src="https://res.cloudinary.com/dnag1wvx8/image/upload/v1655881768/Ellipse_59_lu6dgl.svg"
                            alt=""
                          />
                        </div>
                      ) : null}
                      <div
                        className={
                          msg.author === 0 ? `botChatBox` : `userChatBox`
                        }
                      >
                        <p>{msg.text}</p>
                        {msg.name !== "sendMessage" ? (
                          msg.hasAnswered !== undefined ? (
                            msg.hasAnswered === false ? (
                              <>
                                <div className="userReply">
                                  <input
                                    type="text"
                                    placeholder="Type Your Answer..."
                                    value={userReply}
                                    onChange={(e) => {
                                      setUserReply(e.target.value);
                                      validateInputData(
                                        e.target.value,
                                        msg.name
                                      );
                                    }}
                                    onKeyDown={(e) => {
                                      return  isReplyValid
                                        ? handleEnterSubmit(e, currentIndex)
                                        : null;
                                    }}
                                  />
                                </div>
                                {!isReplyValid ? (
                                  <Fragment>
                                    <span className="small-txt error">
                                      {error}
                                    </span>{" "}
                                    <br />
                                  </Fragment>
                                ) : null}
                                <span className="small-txt">
                                  press enter to send
                                </span>
                              </>
                            ) : null
                          ) : null
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
      </div>
    </div>
    </Fragment>
  );
};

export default Preview;
