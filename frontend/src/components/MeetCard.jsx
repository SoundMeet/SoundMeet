import React from "react";
import Tag from "./Tag";

const MeetCard = () => {
    const tags = ["Genre", "Instrument", "Artist"]
  return (
    <div className="flex-1 w-50 h-50 bg-slate-50 rounded-4xl flex flex-col p-4 text-black gap-2 m-2 text-md">
      <div className="h-30 bg-slate-500 rounded-2xl text-center" ></div>
      <div className="flex justify-between">
        <p>Name of person</p>
        <div className="bg-slate-500 rounded-full w-5 h-5 flex items-center justify-center">
          <i className="fa-solid fa-play text-white text-[10px]"></i>
        </div>
      </div>
      <div className="flex text-sm">
      {tags.map((tag) => <Tag key={tag} tag={tag}/>)}
      </div>
      <div className="flex justify-between">
        <p>Self written description</p>
        <p className="text-xs">5 mile away</p>
      </div>
    </div>
  );
};

export default MeetCard;
