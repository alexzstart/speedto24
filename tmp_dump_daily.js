function getDateSeed(dateString){
  const d=new Date(dateString);
  const y=d.getUTCFullYear();
  const m=d.getUTCMonth()+1;
  const day=d.getUTCDate();
  return y*1000000+m*10000+day*100;
}

function seededRandom(seed){
  let state=seed;
  return function(){
    state=(state*9301+49297)%233280;
    return state/233280;
  };
}

function getPermutations(arr){
  if(arr.length<=1) return [arr];
  const perms=[];
  for(let i=0;i<arr.length;i++){
    const current=arr[i];
    const remaining=[...arr.slice(0,i),...arr.slice(i+1)];
    const remPerms=getPermutations(remaining);
    for(const p of remPerms){
      perms.push([current,...p]);
    }
  }
  return perms;
}

function infixToPostfix(tokens){
  const output=[]; const ops=[]; const prec={'+':1,'-':1,'*':2,'/':2};
  for(const t of tokens){
    if(/^[0-9]+$/.test(t)) output.push(parseFloat(t));
    else if(t==='(') ops.push(t);
    else if(t===')'){
      while(ops.length && ops[ops.length-1] !== '(') output.push(ops.pop());
      if(ops.length && ops[ops.length-1] === '(') ops.pop();
    } else {
      while(ops.length && ops[ops.length-1] !== '(' && prec[ops[ops.length-1]] >= prec[t]){
        output.push(ops.pop());
      }
      ops.push(t);
    }
  }
  while(ops.length) output.push(ops.pop());
  return output;
}

function evaluatePostfix(postfix){
  const stack=[];
  for(const token of postfix){
    if(typeof token==='number') stack.push(token);
    else {
      const b=stack.pop(); const a=stack.pop();
      switch(token){
        case '+': stack.push(a+b); break;
        case '-': stack.push(a-b); break;
        case '*': stack.push(a*b); break;
        case '/': if(b===0) throw new Error('div0'); if(a % b !== 0) throw new Error('frac'); stack.push(a/b); break;
      }
    }
  }
  return stack[0];
}

function evaluateExpression(expr){
  const tokens = expr.match(/(\d+|\+|\-|\*|\/|\(|\))/g);
  const postfix = infixToPostfix(tokens);
  return evaluatePostfix(postfix);
}

function hasSolution(numbers){
  const perms=getPermutations(numbers);
  const ops=['+','-','*','/'];
  for(const p of perms){
    for(const o1 of ops){
      for(const o2 of ops){
        for(const o3 of ops){
          const exprs=[
            `(${p[0]} ${o1} ${p[1]}) ${o2} (${p[2]} ${o3} ${p[3]})`,
            `((${p[0]} ${o1} ${p[1]}) ${o2} ${p[2]}) ${o3} ${p[3]}`,
            `${p[0]} ${o1} (${p[1]} ${o2} (${p[2]} ${o3} ${p[3]}))`
          ];
          for(const e of exprs){
            try{
              const r=evaluateExpression(e);
              if(Math.abs(r-24)<1e-3) return true;
            }catch(err){}
          }
        }
      }
    }
  }
  return false;
}

function generateSeededPuzzle(seed){
  const rand=seededRandom(seed);
  const nums=[];
  for(let i=0;i<4;i++) nums.push(Math.floor(rand()*9)+1);
  const solv=hasSolution(nums);
  return {numbers:nums, hasSolution:solv};
}

// Use Pacific Time like the actual game
function getPacificDateString(date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);
    const get = (t) => parts.find(p => p.type === t)?.value || '';
    const year = get('year');
    const month = get('month');
    const day = get('day');
    return `${year}-${month}-${day}`;
}

const dateString = getPacificDateString(new Date());
const seed = getDateSeed(dateString);
console.log('Pacific Date:', dateString);
for(let i=0;i<5;i++){
  const puzzleSeed = seed + (i * 1000);
  const p = generateSeededPuzzle(puzzleSeed);
  console.log(`Puzzle ${i+1}:`, JSON.stringify(p.numbers), '-', p.hasSolution ? 'Solvable' : 'No Solution');
}


