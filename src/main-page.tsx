import "./index.css";
import type { Image } from "wasp/entities";
// import { getTasks, useQuery } from "wasp/client/operations";
import { ChangeEvent, FormEvent } from "react";
import { logout } from "wasp/client/auth";


export const MainPage = () => {
  // const { data: tasks, isLoading, error } = useQuery(getTasks);

  return (
    <div>
			<NewTaskForm />
      {/* {tasks && <TasksList tasks={tasks} />} */}

      {/* {isLoading && "Loading..."}
      {error && "Error: " + error} */}
			<button onClick={logout}>Logout</button>
    </div>
  );
};

const TaskView = ({ task }: { task: Image }) => {
	const handleOnDoneChange = async(event: ChangeEvent<HTMLInputElement>) => {
		event?.preventDefault();
		// try {
		// 	await updateTask({
		// 		id: task?.id,
		// 		isDone: event.target.checked
		// 	})
		// }
		// catch (err: unknown){
		// 	if (err instanceof Error) {
    //     window.alert("Error: " + err.message);
    //   } else {
    //     window.alert("An unknown error occurred");
    //   }
		// }
	}

  return (
    <div>
      {/* <input type="checkbox" id={String(task.id)} checked={task.isDone} onChange={handleOnDoneChange}/> */}
      {task.description}
    </div>
  );
};

const TasksList = ({ tasks }: { tasks: Image[] }) => {
  if (!tasks?.length) return <div>No tasks</div>;

  return (
    <div>
      {tasks.map((task, idx) => (
        <TaskView task={task} key={idx} />
      ))}
    </div>
  );
};

const NewTaskForm = () => {
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // try {
    //   const target = event.target as HTMLFormElement;
    //   const description = target.description.value;
    //   target.reset();
    //   await createTask({ description });
    // } catch (err: unknown) {
    //   if (err instanceof Error) {
    //     window.alert("Error: " + err.message);
    //   } else {
    //     window.alert("An unknown error occurred");
    //   }
    // }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="description" type="text" defaultValue="" />
      <input type="submit" value="Create task" />
    </form>
  );
};