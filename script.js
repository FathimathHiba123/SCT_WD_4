
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('task-text');
    const taskCategory = document.getElementById('task-category');
    const taskDate = document.getElementById('task-date');
    const taskPriority = document.getElementById('task-priority');
    const addTaskBtn = document.getElementById('add-task');
    const searchInput = document.getElementById('search-task');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const taskList = document.getElementById('task-list');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const progressFill = document.querySelector('.progress-fill');
    const progressCount = document.getElementById('progress-count');
    
    // State
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    
    // Initialize
    renderTasks();
    updateProgress();
    
    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });
    searchInput.addEventListener('input', filterTasks);
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            filterTasks();
        });
    });
    
    // Functions
    function addTask() {
        const text = taskInput.value.trim();
        if (!text) return;
        
        const newTask = {
            id: Date.now(),
            text,
            category: taskCategory.value,
            date: taskDate.value,
            priority: taskPriority.value,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        saveTasks();
        renderTasks();
        updateProgress();
        
        // Reset input
        taskInput.value = '';
        taskInput.focus();
        
        // Add animation
        const taskElements = document.querySelectorAll('.task-item');
        if (taskElements.length > 0) {
            const lastTask = taskElements[taskElements.length - 1];
            lastTask.style.animation = 'fadeIn 0.5s ease-in-out';
        }
    }
    
    function renderTasks() {
        taskList.innerHTML = '';
        
        if (tasks.length === 0) {
            taskList.innerHTML = '<li class="empty-message">No tasks found. Add one above!</li>';
            return;
        }
        
        // Sort tasks by priority (High > Medium > Low) and then by date
        tasks.sort((a, b) => {
            const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
            if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return new Date(a.date) - new Date(b.date);
        });
        
        tasks.forEach(task => {
            const taskElement = document.createElement('li');
            taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskElement.dataset.id = task.id;
            
            taskElement.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${task.text}</span>
                <span class="task-category category-${task.category.replace(/\s+/g, '')}">${task.category}</span>
                ${task.date ? `<span class="task-date">${formatDate(task.date)}</span>` : '<span class="task-date">No date</span>'}
                <span class="task-priority priority-${task.priority.toLowerCase()}">${task.priority}</span>
                <div class="task-actions">
                    <button class="edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            
            taskList.appendChild(taskElement);
            
            // Add event listeners
            const checkbox = taskElement.querySelector('.task-checkbox');
            const editBtn = taskElement.querySelector('.edit-btn');
            const deleteBtn = taskElement.querySelector('.delete-btn');
            
            checkbox.addEventListener('change', function() {
                toggleTaskComplete(task.id, this.checked);
            });
            
            editBtn.addEventListener('click', function() {
                editTask(task.id);
            });
            
            deleteBtn.addEventListener('click', function() {
                deleteTask(task.id);
            });
        });
        
        filterTasks();
    }
    
    function toggleTaskComplete(id, completed) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = completed;
            saveTasks();
            updateProgress();
            filterTasks();
            
            // Add animation
            const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
            if (taskElement) {
                taskElement.style.animation = completed ? 'pulse 0.5s' : 'fadeIn 0.5s';
            }
        }
    }
    
    function editTask(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        
        taskInput.value = task.text;
        taskCategory.value = task.category;
        taskDate.value = task.date;
        taskPriority.value = task.priority;
        
        // Remove the task
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
        updateProgress();
        
        taskInput.focus();
    }
    
    function deleteTask(id) {
        // Add animation
        const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
        if (taskElement) {
            taskElement.style.animation = 'slideOut 0.3s forwards';
            setTimeout(() => {
                tasks = tasks.filter(t => t.id !== id);
                saveTasks();
                renderTasks();
                updateProgress();
            }, 300);
        }
    }
    
    function clearCompletedTasks() {
        // Add animation
        const completedTasks = document.querySelectorAll('.task-item.completed');
        if (completedTasks.length > 0) {
            completedTasks.forEach(task => {
                task.style.animation = 'slideOut 0.3s forwards';
            });
            
            setTimeout(() => {
                tasks = tasks.filter(t => !t.completed);
                saveTasks();
                renderTasks();
                updateProgress();
            }, 300);
        }
    }
    
    function filterTasks() {
        const searchTerm = searchInput.value.toLowerCase();
        const taskElements = document.querySelectorAll('.task-item');
        
        taskElements.forEach(element => {
            const taskId = parseInt(element.dataset.id);
            const task = tasks.find(t => t.id === taskId);
            
            if (!task) return;
            
            const matchesSearch = task.text.toLowerCase().includes(searchTerm);
            let matchesFilter = true;
            
            if (currentFilter === 'pending') {
                matchesFilter = !task.completed;
            } else if (currentFilter === 'completed') {
                matchesFilter = task.completed;
            }
            
            if (matchesSearch && matchesFilter) {
                element.style.display = 'grid';
            } else {
                element.style.display = 'none';
            }
        });
    }
    
    function updateProgress() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        progressFill.style.width = `${percentage}%`;
        progressCount.textContent = `${completedTasks}/${totalTasks}`;
        
        // Change progress bar color based on completion
        if (percentage < 30) {
            progressFill.style.background = 'linear-gradient(90deg, var(--danger), var(--warning))';
        } else if (percentage < 70) {
            progressFill.style.background = 'linear-gradient(90deg, var(--warning), var(--primary))';
        } else {
            progressFill.style.background = 'linear-gradient(90deg, var(--primary), var(--success))';
        }
    }
    
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'No date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    // Add animations to the stylesheet
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(72, 149, 239, 0.4); }
            70% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(72, 149, 239, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(72, 149, 239, 0); }
        }
        
        @keyframes slideOut {
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});