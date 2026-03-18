import React from "react";
import Navbar from "../components/Navbar";
import reactLogo from "../assets/react.svg"
import Jam from "../components/Jam";
const Home = () => {
  const jams = [
    { 
      img:reactLogo,
      title: "title of jam",
      desc:"describe the jame",
      tags:[],
    },
    { 
      img:reactLogo,
      title: "title of jam",
      desc:"describe the jame",
      tags:[],
    },
    { 
      img:reactLogo,
      title: "title of jam",
      desc:"describe the jame",
      tags:[],
    },
    { 
      img:reactLogo,
      title: "title of jam",
      desc:"describe the jame",
      tags:[],
    },
  ];
  return (
    <div className="min-h-screen bg-pink-950 flex-col">
      <Navbar />
      <h1 className="pl-8 text-xl">Ready to Jam?</h1>
      <div className="flex gap-4 px-8 py-2">
        <div className="flex-1">
          
          <img
            src="https://storage.googleapis.com/support-forums-api/attachment/message-133252936-14021676145025816477.PNG"
            alt=""
            className="object-cover rounded-xl w-full"
          />
        </div>
        <div className="w-[25%] rounded-lg p-4 bg-orange-900">
          Sidebar
          <div className="flex justify-around">
            <h1>Feed</h1>
            <p>** </p>
          </div>
          {jams.map((jam, i) => (
            <Jam key={i}/>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
