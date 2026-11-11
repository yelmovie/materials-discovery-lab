// Expected answers for browser QA. This file never writes learner state.
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';

const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try {
 const [model,tasks,concepts]=await Promise.all([
  server.ssrLoadModule('/src/domain/model.ts'),
  server.ssrLoadModule('/src/domain/challenges.ts'),
  server.ssrLoadModule('/src/domain/concepts.ts'),
 ]);
 const reference={
  challenges:tasks.challenges,
  conceptDuration:concepts.CONCEPT_SECONDS,
  lab:{
   experiments:model.experiments,
   comparisons:model.requiredComparisons,
   names:model.shortNames,
   results:Object.fromEntries(model.experiments.map(experiment=>[
    experiment,Object.fromEntries(model.materials.map(sample=>[
     sample.id,model.resultFor(experiment,sample.id),
    ])),
   ])),
  },
 };
 await mkdir('.tmp',{recursive:true});
 await writeFile('.tmp/delivery-reference.json',JSON.stringify(reference));
 console.log('Expected domain data written to .tmp/delivery-reference.json');
} finally {
 await server.close();
}
