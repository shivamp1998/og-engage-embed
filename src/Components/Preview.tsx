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

  const convertIntoPostFix = (formula: string[])=> {
    for( let i = 0 ; i< formula.length ; i++) {
        const activeElem = formula[i];
        if (isOperator(activeElem)) {

        }
    }
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
            
        }
    } 
  }, [currentQuestionIndex]);

  return (
    <Fragment>
      <h1> Welcome to Preview </h1>
    </Fragment>
  );
};

export default Preview;
