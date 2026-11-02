const categories=[
 {id:'ball',title:'Ball basics',description:'Choose parts, create studies and save types.',steps:ballSteps},
 {id:'icons',title:'Icon controls',description:'See every icon and its result.',steps:iconsSteps},
 {id:'tools',title:'Tools',description:'Try each constraint and comparison preview.',steps:toolsSteps},
 {id:'tabs',title:'Tabs',description:'Balls, Filter Lab, Reference Image and History.',steps:tabsSteps}
];
const steps=categories.flatMap(category=>category.steps.map(step=>({...step,category:category.id})));
