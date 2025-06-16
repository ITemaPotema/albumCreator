document.addEventListener('alpine:init', () => {
    Alpine.data('auth', () => ({
        isLogin: true,

        validatePasswordWithRegex(password) {
            const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()]).{8,}$/;
            return re.test(password);
        },

        validateEmail(email) {
            const re = /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
            return re.test(email);
        },

        login() {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            })
            .then(response => {
                if (response.ok) {
                    window.location.href = '/';
                }
                else {
                    alert('Ошибка регистрации');
                }
            }
            )

            console.log('Login attempt:', { email, password });
        },

        register() {
            const name = document.getElementById('regName').value;
            const surname = document.getElementById('regSurname').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;

            // Проверка совпадения паролей
            if (password !== confirmPassword) {
                alert("Пароли не совпадают");
                return;
            }

            if (!this.validateEmail(email)) {
                alert("Неверный формат email");
                return;
            }

            if (!this.validatePasswordWithRegex(password)) {
                alert("Пароль должен содержать: минимум 8 символов, цифру, заглавную, строчную букву и спецсимвол");
                return;
            }

            fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    surname: surname,
                    email: email,
                    password: password
                })
            })
            .then(response => {
                if (response.ok) {
                    window.location.href = '/';
                }
                else {
                    alert('Ошибка регистрации');
                }
            }
            )

            console.log('Register attempt:', { name, surname, email, password });
        }
    }));
});