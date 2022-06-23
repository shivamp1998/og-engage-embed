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

  useEffect(() => {
    if (previewId) {
      axiosGet(`/users/questions?url=${previewId}&status=${"live"}`)
        .then((response) => {
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

  useEffect(() => {
    if (currentQuestionIndex != null) {
        if(questions[currentQuestionIndex].name === 'button') {
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
