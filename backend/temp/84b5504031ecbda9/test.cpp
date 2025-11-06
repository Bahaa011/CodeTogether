#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
using namespace std;

// Student class definition
class Student {
private:
    string name;
    double grade;
public:
    Student(string n, double g) {
        name = n;
        grade = g;
    }

    string getName() const { return name; }
    double getGrade() const { return grade; }

    void print() const {
        cout << "Name: " << name << ", Grade: " << grade << endl;
    }
};

// Comparison function for sorting
bool compareByGrade(const Student &a, const Student &b) {
    return a.getGrade() > b.getGrade();
}

int main() {
    vector<Student> students;
    int n;

    cout << "Enter number of students: ";
    cin >> n;

    for (int i = 0; i < n; i++) {
        string name;
        double grade;
        cout << "Enter name of student " << i + 1 << ": ";
        cin >> name;
        cout << "Enter grade: ";
        cin >> grade;
        students.push_back(Student(name, grade));
    }

    sort(students.begin(), students.end(), compareByGrade);

    cout << "\n--- Sorted Students (Highest to Lowest) ---\n";
    for (const auto &s : students) {
        s.print();
    }

    double total = 0;
    for (const auto &s : students)
        total += s.getGrade();

    cout << "\nClass Average: " << total / n << endl;
    return 0;
}
