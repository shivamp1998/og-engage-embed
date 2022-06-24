import axios from "axios";
import { useEffect, Fragment, useState } from "react";
import { useLocation } from "react-router-dom";
import { axiosGet, axiosPost } from "../Utils/axiosHelper";
const Preview = () => {
  const location = useLocation();
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
        
    }
  }

  return (
    <Fragment>
      <h1> Welcome to Preview </h1>
    </Fragment>
  );
};

export default Preview;
