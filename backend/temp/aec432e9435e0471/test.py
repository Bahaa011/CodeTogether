# -------------------------------------------
# Student Grade Manager - 100 Line Example
# -------------------------------------------
# Demonstrates loops, conditionals, functions,
# dictionaries, lists, and user input handling.
# -------------------------------------------

students = {}  # key: student name, value: list of grades

def print_menu():
    print("\n===== Student Grade Manager =====")
    print("1. Add a new student")
    print("2. Add grade for a student")
    print("3. View student grades")
    print("4. Calculate student average")
    print("5. Show class average")
    print("6. Show top student")
    print("7. Remove a student")
    print("8. Show all students")
    print("9. Exit")
    print("=================================")

def add_student():
    name = input("Enter student name: ").strip()
    if name in students:
        print(f"{name} already exists!")
    else:
        students[name] = []
        print(f"Added student {name} successfully.")

def add_grade():
    name = input("Enter student name: ").strip()
    if name not in students:
        print("Student not found!")
        return
    try:
        grade = float(input("Enter grade (0-100): "))
        if 0 <= grade <= 100:
            students[name].append(grade)
            print(f"Added grade {grade} for {name}.")
        else:
            print("Grade must be between 0 and 100.")
    except ValueError:
        print("Invalid number entered.")

def view_grades():
    name = input("Enter student name: ").strip()
    if name not in students:
        print("Student not found.")
        return
    grades = students[name]
    if not grades:
        print(f"{name} has no grades yet.")
    else:
        print(f"{name}'s Grades: {grades}")

def calc_student_average():
    name = input("Enter student name: ").strip()
    if name not in students:
        print("Student not found.")
        return
    grades = students[name]
    if not grades:
        print(f"{name} has no grades yet.")
        return
    avg = sum(grades) / len(grades)
    print(f"{name}'s average is {avg:.2f}")

def show_class_average():
    if not students:
        print("No students in class.")
        return
    total, count = 0, 0
    for grades in students.values():
        if grades:
            total += sum(grades)
            count += len(grades)
    if count == 0:
        print("No grades recorded yet.")
    else:
        avg = total / count
        print(f"Class average: {avg:.2f}")

def show_top_student():
    if not students:
        print("No students in class.")
        return
    top_name = None
    top_avg = -1
    for name, grades in students.items():
        if grades:
            avg = sum(grades) / len(grades)
            if avg > top_avg:
                top_avg = avg
                top_name = name
    if top_name:
        print(f"Top student: {top_name} with average {top_avg:.2f}")
    else:
        print("No grades recorded yet.")

def remove_student():
    name = input("Enter student name to remove: ").strip()
    if name in students:
        del students[name]
        print(f"Removed {name} from the system.")
    else:
        print("Student not found.")

def show_all_students():
    if not students:
        print("No students available.")
    else:
        print("All Students:")
        for name in students:
            print(f" - {name}")

# --------- Main Program Loop ---------------
while True:
    print_menu()
    choice = input("Choose an option (1-9): ").strip()

    if choice == '1':
        add_student()
    elif choice == '2':
        add_grade()
    elif choice == '3':
        view_grades()
    elif choice == '4':
        calc_student_average()
    elif choice == '5':
        show_class_average()
    elif choice == '6':
        show_top_student()
    elif choice == '7':
        remove_student()
    elif choice == '8':
        show_all_students()
    elif choice == '9':
        print("Goodbye!")
        break
    else:
        print("Invalid option. Please try again.")
