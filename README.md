sudo apt install python3-pip
sudo apt install python3-venv
pip3 install django
python3 -m venv .venv
source .venv/bin/activate

python3 manage.py makemigrations mail
python3 manage.py migrate
python3 manage.py runserver