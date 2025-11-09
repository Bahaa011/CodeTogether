# ===============================================
# Student Grade Tracker
# A 100-line Python program with user inputs
# ===============================================
import statistics

def main():
    print("=== Welcome to the Grade Tracker ===")
    print("You'll enter student names and their grades.")
    print("Then we'll calculate averages, ranks, and save them to a file.\n")

    students = []

    # Step 1: Input number of students
    while True:
        try:
            n = int(input("Enter number of students: "))
            if n <= 0:
                print("Number must be positive.")
                continue
            break
        except ValueError:
            print("Please enter a valid number!")

    # Step 2: Input student data
    for i in range(n):
        print(f"\nStudent {i+1}/{n}")
        name = input("Enter student name: ").strip()
        grades = []
        for j in range(3):
            while True:
                try:
                    grade = float(input(f"Enter grade {j+1} for {name}: "))
                    if 0 <= grade <= 100:
                        grades.append(grade)
                        break
                    else:
                        print("Grade must be between 0 and 100.")
                except ValueError:
                    print("Invalid input. Please enter a number.")
        students.append((name, grades))

    # Step 3: Calculate averages
    averages = []
    for name, grades in students:
        avg = sum(grades) / len(grades)
        averages.append((name, avg))

    # Step 4: Sort by average descending
    averages.sort(key=lambda x: x[1], reverse=True)

    # Step 5: Display ranked results
    print("\n=== Student Rankings ===")
    for rank, (name, avg) in enumerate(averages, start=1):
        print(f"{rank}. {name:15} -> Average: {avg:.2f}")

    # Step 6: Basic stats
    all_grades = [g for _, grades in students for g in grades]
    mean = statistics.mean(all_grades)
    median = statistics.median(all_grades)
    stdev = statistics.stdev(all_grades)

    print("\n=== Overall Statistics ===")
    print(f"Mean grade:   {mean:.2f}")
    print(f"Median grade: {median:.2f}")
    print(f"Std. Dev:     {stdev:.2f}")

    # Step 7: Find top and bottom student
    top_student = max(averages, key=lambda x: x[1])
    bottom_student = min(averages, key=lambda x: x[1])
    print(f"\nTop student: {top_student[0]} ({top_student[1]:.2f})")
    print(f"Lowest student: {bottom_student[0]} ({bottom_student[1]:.2f})")

    # Step 8: Optionally search for a student
    while True:
        search = input("\nEnter a name to view their grades (or 'exit'): ").strip()
        if search.lower() == "exit":
            break
        found = False
        for name, grades in students:
            if name.lower() == search.lower():
                print(f"Grades for {name}: {grades}")
                print(f"Average: {sum(grades)/len(grades):.2f}")
                found = True
        if not found:
            print("Student not found.")

    # Step 9: Save to file
    filename = input("\nEnter filename to save results (e.g., results.txt): ")
    with open(filename, "w") as f:
        f.write("=== Student Rankings ===\n")
        for rank, (name, avg) in enumerate(averages, start=1):
            f.write(f"{rank}. {name:15} -> Average: {avg:.2f}\n")
        f.write("\n=== Overall Stats ===\n")
        f.write(f"Mean: {mean:.2f}\nMedian: {median:.2f}\nStd Dev: {stdev:.2f}\n")

    print(f"\nResults saved to {filename}")
    print("=== End of Program ===")

# Run main program
if __name__ == "__main__":
    main()