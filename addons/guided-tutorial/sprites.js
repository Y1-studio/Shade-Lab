function tutorialSprite(pose){
 const data=tutorialSpriteData[pose],image=document.createElement('img');
 image.className='tutorial-sprite';image.dataset.pose=pose;image.src=data.src;
 image.width=data.width;image.height=data.height;
 image.alt=pose==='glasses'?'Tutorial guide wearing glasses':'Tutorial guide';
 image.draggable=false;
 return image;
}
function tutorialSpriteCredit(){
 const credit=document.createElement('p'),link=document.createElement('a');
 credit.className='tutorial-sprite-credit';credit.append('Sprite art: ');
 link.textContent='@nerukka38261';link.href='https://x.com/nerukka38261';
 link.target='_blank';link.rel='noopener noreferrer';credit.append(link);
 return credit;
}
