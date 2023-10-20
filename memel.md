# Project Memel: - Parallel Javascript Machine

> Project Memel is an environmet for running parallel Javascript tasks, which are semi-automatically parallelized
by a special server and executed by a number of networked clients - OPUs (Object Processing Units).

__[Live System Preview](http://www.prodata.lt:8888)__

__[Feedback & Support](mailto://vladas@prodata.lt)__

__[Project Memel homepage](http://www.prodata.lt/EN/Programming/ipct.html)__

##
## System design
##
> The original idea for this project is described in this [White paper](http://www.prodata.lt/EN/Programming/OPU_computing_model.pdf), which explains the possibility to parallelize Javascript code using a bunch of interconnected servers and workers (Object Processing Units - OPUs).

> The Parallel Javascript Machine uses NodeJS, and is implemented as a Web server for the frontend, as well as a server for the OPUs that really do the parallel execution of code. OPUs are small Javascript network clients implemented in NodeJS too. There may be pretty much of them, connected to the main parallel machine server either locally or remotely. The overall performance of parallel processing strongly depends on the number of connected OPUs.

> All these parts, working together, may be understood as a mini-OS which launches and parses the running scripts (tasks), puts them into system execution queue and provides some kind of cooperative multitasking. The results are printed to the Web client's console by pipelining `console.log` output from OPUs through the main server.
##
## How it works
##
### Tasks, Variables and The Queue
##
> Like any other OS, Parallel Machine Mini-OS have a kernel. The kernel operates with such internal structures as the Queue object, Task list and Task variables object.

![OS areas Structure](http://www.prodata.lt:8888/cljs/images/OPU2.gif)

> When the task is launched, its source code is passed to `Parallelizator` function, where it is separated into single statements (also can be grouped in blocks). Every statement or block then enqueued into the system's Queue for execution by OPUs, which are connected to the server and extract these statements from the Queue one by one in no predetermined order. In parallel programming terms it is said, that the tasks are parallelized on the *statement level*, or with *statement ganularity*. 

> The parallelization process is controlled by special instructions (or hints), called `#pragmas`. Some of them sets the start of parallel/sequential code, other sets beginnig/end of blocks, parallel variables (so called *Parvars*), begin/end of the process timing. The one of them, `#pragma wait`, is very important for the parallelization flow control, and marks the *assembly point* in the task. At this point the parallelization of the task is suspended until all pending parallel chunks of code are finished their execution (for parallel loops it waits for all iterations to complete). After that the process of parallelization resumes from this point. The 'wait' process in the system is really non-blocking, letting other parts of the task to continue their execution, what is exactly opposite to the ordinary one-threaded Javascript interpreter.

> During the process of parallelization, when some statements contain an internal block of statements (such as loops, functions, if-then-else blocks), the `Analizator` function is called. It provides more specialized interpretaion of code logic. For example, it interprets `for` loop's initial expression, condition and step. This information then is added to the parallel code chunks as an extra internal code.

> Another important part of parallel tasks execution is the task variables handling. All task's variables are stored within the server Task object. Before the task chunk is put into the Queue, the `parallelizator` function determines which variables are in use within this chunk. It puts these variables along with their values as a definition to the preamble of the code. After execution of the code chunk, the resulting values of variables are returned and set back to the server's task object. There are some special *parallel variables* (`Parvars`), which are handled differently. These variables are *declared* by `#pragma parvar [var name]` special instruction. This means, that these variables can be accessed and set concurrently. All 4 basic arithmetic operations are transitive (if processed one by one), so they can be processed in any order, and the result will always be the same. The parallel `for` loop works exactly in this way. So the accumulator variable for the loop must be set in the way that it could be accessed and modified concurrently. This is what `Parvars` are for. The kernel adds additional code fragments that synchronously calls the main server for variable value and locks it in order to be modified after the code chunk had finished its execution. It is important that the code chunk would be fast and atomic, so it would lock the `parvar` for as short time as possible. 
##
### Object Processing Units (OPUs)
##
> OPU (Object Processing Unit) is a lightweight networking client (worker) which does the actual processing of parallelized chunks of code. OPU connects to the main server and scans the Queue for the next job in FIFO manner. When it founds a job, it executes it, returns the result (task variables) and scans again. If no jobs are found it enters an idle loop and waits. Therefore OPUs are pro-active, because they initiate job extracting and processing. There may be an unlimited number of OPUs, connected to the main server, working independently. Their number is only limited by server's processing power and the network speed.

![OPU Structure](http://www.prodata.lt:8888/cljs/images/OPU3.gif)

> OPUs have another very important function. When they meet `Parvars`, they connect directly to the main server to get realtime value of `Parvar`, and after Parvar is changed its value they connect again and set its changed value to the corresponding task variable. While OPUs are processing `Parvars` in such way, these are locked on the server to prevent race condition. Thus, it's said, that the system has data bound control flow, which is opposite to the statement level control flow as it's usual for all non-parallel systems.

##
### Multi-user environment
##
> Multi-user access is very important for this Project. It lets users to launch tasks independently and asynchronously. Every task in the system belongs to a particular user, and only that user can see his task's output. When some user is registered in the system, he gets his own *workspace* with examples. He can then modify and save any file in his workspace, as well as to create new. The user's launched tasks may, in fact, execute in parallel. It depends on how often tasks waits for parallelization in *assembly points* (look at the previous section for this term). Such tasks behaviour is often called *cooperative multitasking*. All tasks in the system should give a 'breath' for all other tasks in the system, and the `#pragma wait` instruction is a way to do this.
##
## What Next? The Future of the Project
##
> The Project Memel is still in early alpha stage and pretends only for a 'Technology Preview'. If the community will find it useful in real parallel 'number-crunching' applications, the development will be continued. Any donations are welcome to the PayPal account `vladas@prodata.lt`.
##
## Authors
##
> Vladas Saulis - [Owner & CEO of Prodata](http://www.prodata.lt)
##
## License
##
> At the moment it is decided not to disclose the source code for this project. However, in some future, it might be considered to put the code to the public domain and *opensource* it under MIT license.
