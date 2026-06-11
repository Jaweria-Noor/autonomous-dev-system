import fetch from 'node-fetch';

const BASE_URL = `http://localhost:${process.env.PORT || 3001}`;

async function createTask() {
  const res = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Autonomous Demo', description: 'Full pipeline execution test' })
  });
  const data = await res.json();
  return data.id || data._id || data.id;
}

async function executeTask(id) {
  await fetch(`${BASE_URL}/api/tasks/${id}/execute`, { method: 'POST' });
}

async function getTask(id) {
  const res = await fetch(`${BASE_URL}/api/tasks/${id}`);
  return await res.json();
}

(async () => {
  try {
    const taskId = await createTask();
    console.log('Created task', taskId);
    await executeTask(taskId);
    console.log('Execution started');
    // Poll until status is Success or Failed
    let status = '';
    while (true) {
      const task = await getTask(taskId);
      status = task.status;
      console.log('Current status:', status);
      if (status === 'Success' || status === 'Failed') break;
      await new Promise(r => setTimeout(r, 5000));
    }
    console.log('Final status:', status);
    // Print artifact zip path if success
    if (status === 'Success') {
      console.log('Deployment zip should be at generated-code/task-' + taskId + '-deployment.zip');
    }
  } catch (e) {
    console.error('Error:', e);
  }
})();
