  document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const taskInput = document.getElementById('task-input');
            const taskDue = document.getElementById('task-due');
            const taskPriority = document.getElementById('task-priority');
            const addTaskBtn = document.getElementById('add-task-btn');
            const taskList = document.getElementById('task-list');
            const emptyState = document.getElementById('empty-state');
            
            // Stats elements
            const totalTasksEl = document.getElementById('total-tasks');
            const activeTasksCountEl = document.getElementById('active-tasks-count');
            const completedTasksCountEl = document.getElementById('completed-tasks-count');
            
            // Filter buttons
            const allTasksBtn = document.getElementById('all-tasks');
            const activeTasksFilterBtn = document.getElementById('active-tasks-filter');
            const completedTasksFilterBtn = document.getElementById('completed-tasks-filter');
            const clearCompletedBtn = document.getElementById('clear-completed');
            
            // Modal elements
            const editModal = document.getElementById('edit-modal');
            const closeModalBtn = document.getElementById('close-modal');
            const cancelEditBtn = document.getElementById('cancel-edit');
            const saveEditBtn = document.getElementById('save-edit');
            const editTaskInput = document.getElementById('edit-task-input');
            const editTaskDue = document.getElementById('edit-task-due');
            const editTaskPriority = document.getElementById('edit-task-priority');
            
            // Delete dialog elements
            const deleteDialog = document.getElementById('delete-dialog');
            const cancelDeleteBtn = document.getElementById('cancel-delete');
            const confirmDeleteBtn = document.getElementById('confirm-delete');

            // App state
            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            let currentFilter = 'all';
            let currentEditTaskId = null;
            let currentDeleteTaskId = null;

            // Initialize the app
            renderTasks();
            updateStats();

            // Event listeners
            addTaskBtn.addEventListener('click', addTask);
            taskInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') addTask();
            });

            // Filter buttons
            allTasksBtn.addEventListener('click', () => {
                currentFilter = 'all';
                updateActiveFilterButton();
                renderTasks();
            });

            activeTasksFilterBtn.addEventListener('click', () => {
                currentFilter = 'active';
                updateActiveFilterButton();
                renderTasks();
            });

            completedTasksFilterBtn.addEventListener('click', () => {
                currentFilter = 'completed';
                updateActiveFilterButton();
                renderTasks();
            });

            clearCompletedBtn.addEventListener('click', clearCompletedTasks);

            // Modal buttons
            closeModalBtn.addEventListener('click', closeEditModal);
            cancelEditBtn.addEventListener('click', closeEditModal);
            saveEditBtn.addEventListener('click', saveEditedTask);

            // Delete dialog buttons
            cancelDeleteBtn.addEventListener('click', closeDeleteDialog);
            confirmDeleteBtn.addEventListener('click', confirmDeleteTask);

            function updateActiveFilterButton() {
                // Remove active class from all buttons
                allTasksBtn.classList.remove('btn-secondary', 'btn-outline');
                activeTasksFilterBtn.classList.remove('btn-secondary', 'btn-outline');
                completedTasksFilterBtn.classList.remove('btn-secondary', 'btn-outline');
                clearCompletedBtn.classList.remove('btn-secondary', 'btn-outline');
                
                // Add appropriate classes based on current filter
                allTasksBtn.classList.add('btn-outline');
                activeTasksFilterBtn.classList.add('btn-outline');
                completedTasksFilterBtn.classList.add('btn-outline');
                clearCompletedBtn.classList.add('btn-outline');
                
                switch(currentFilter) {
                    case 'all':
                        allTasksBtn.classList.add('btn-secondary');
                        break;
                    case 'active':
                        activeTasksFilterBtn.classList.add('btn-secondary');
                        break;
                    case 'completed':
                        completedTasksFilterBtn.classList.add('btn-secondary');
                        break;
                }
            }

            function addTask() {
                const title = taskInput.value.trim();
                const dueDate = taskDue.value;
                const priority = taskPriority.value;
                
                if (title) {
                    const newTask = {
                        id: Date.now(),
                        title,
                        completed: false,
                        dueDate: dueDate || null,
                        priority: priority || null,
                        createdAt: new Date().toISOString()
                    };
                    
                    tasks.unshift(newTask);
                    saveTasks();
                    renderTasks();
                    updateStats();
                    
                    // Clear inputs
                    taskInput.value = '';
                    taskDue.value = '';
                    taskPriority.value = '';
                    taskInput.focus();
                }
            }

            function renderTasks() {
                // Filter tasks based on current filter
                let filteredTasks = tasks;
                if (currentFilter === 'active') {
                    filteredTasks = tasks.filter(task => !task.completed);
                } else if (currentFilter === 'completed') {
                    filteredTasks = tasks.filter(task => task.completed);
                }

                if (filteredTasks.length === 0) {
                    emptyState.style.display = 'block';
                    taskList.innerHTML = '';
                    taskList.appendChild(emptyState);
                } else {
                    emptyState.style.display = 'none';
                    taskList.innerHTML = '';
                    
                    filteredTasks.forEach(task => {
                        const taskItem = document.createElement('li');
                        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
                        taskItem.dataset.id = task.id;
                        
                        // Priority badge
                        let priorityBadge = '';
                        if (task.priority) {
                            priorityBadge = `<span class="task-priority priority-${task.priority}">${task.priority}</span>`;
                        }
                        
                        taskItem.innerHTML = `
                            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                            <div class="task-content">
                                <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
                                <div class="task-details">
                                    ${task.dueDate ? `
                                        <div class="task-due">
                                            <i class="far fa-calendar-alt"></i>
                                            ${formatDueDate(task.dueDate)}
                                        </div>
                                    ` : ''}
                                    ${priorityBadge}
                                </div>
                            </div>
                            <div class="task-actions">
                                <button class="btn-icon btn-outline edit-btn" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon btn-outline delete-btn" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `;
                        
                        taskList.appendChild(taskItem);
                    });

                    // Add event listeners to all checkboxes, edit and delete buttons
                    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
                        checkbox.addEventListener('change', toggleTaskComplete);
                    });

                    document.querySelectorAll('.edit-btn').forEach(btn => {
                        btn.addEventListener('click', openEditModal);
                    });

                    document.querySelectorAll('.delete-btn').forEach(btn => {
                        btn.addEventListener('click', openDeleteDialog);
                    });
                }
            }

            function toggleTaskComplete(e) {
                const taskId = parseInt(e.target.closest('.task-item').dataset.id);
                const task = tasks.find(task => task.id === taskId);
                
                if (task) {
                    task.completed = e.target.checked;
                    saveTasks();
                    renderTasks();
                    updateStats();
                }
            }

            function openEditModal(e) {
                const taskItem = e.target.closest('.task-item');
                const taskId = parseInt(taskItem.dataset.id);
                const task = tasks.find(task => task.id === taskId);
                
                if (task) {
                    currentEditTaskId = taskId;
                    editTaskInput.value = task.title;
                    editTaskDue.value = task.dueDate || '';
                    editTaskPriority.value = task.priority || '';
                    editModal.classList.add('active');
                }
            }

            function closeEditModal() {
                editModal.classList.remove('active');
                currentEditTaskId = null;
            }

            function saveEditedTask() {
                if (currentEditTaskId) {
                    const task = tasks.find(task => task.id === currentEditTaskId);
                    
                    if (task) {
                        const newTitle = editTaskInput.value.trim();
                        if (newTitle) {
                            task.title = newTitle;
                            task.dueDate = editTaskDue.value || null;
                            task.priority = editTaskPriority.value || null;
                            
                            saveTasks();
                            renderTasks();
                            closeEditModal();
                        }
                    }
                }
            }

            function openDeleteDialog(e) {
                const taskItem = e.target.closest('.task-item');
                const taskId = parseInt(taskItem.dataset.id);
                currentDeleteTaskId = taskId;
                deleteDialog.classList.add('active');
            }

            function closeDeleteDialog() {
                deleteDialog.classList.remove('active');
                currentDeleteTaskId = null;
            }

            function confirmDeleteTask() {
                if (currentDeleteTaskId) {
                    tasks = tasks.filter(task => task.id !== currentDeleteTaskId);
                    saveTasks();
                    renderTasks();
                    updateStats();
                    closeDeleteDialog();
                }
            }

            function clearCompletedTasks() {
                tasks = tasks.filter(task => !task.completed);
                saveTasks();
                renderTasks();
                updateStats();
            }

            function saveTasks() {
                localStorage.setItem('tasks', JSON.stringify(tasks));
            }

            function updateStats() {
                totalTasksEl.textContent = tasks.length;
                const activeTasks = tasks.filter(task => !task.completed).length;
                const completedTasks = tasks.length - activeTasks;
                
                activeTasksCountEl.textContent = activeTasks;
                completedTasksCountEl.textContent = completedTasks;
            }

            function formatDueDate(dateTimeString) {
                const date = new Date(dateTimeString);
                const now = new Date();
                
                // If due date is today, show time only
                if (date.toDateString() === now.toDateString()) {
                    return `Today, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                }
                
                // If due date is tomorrow, show "Tomorrow"
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                if (date.toDateString() === tomorrow.toDateString()) {
                    return `Tomorrow, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                }
                
                // Otherwise show full date
                return date.toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute:'2-digit'
                });
            }

            // Initialize with all tasks button active
            updateActiveFilterButton();
        });