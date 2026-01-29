fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn subtract(a: i32, b: i32) -> i32 {
    a - b
}

fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

const NUMBERS: u32 = 10000;

fn read_from_file(path: &str) -> Result<Vec<i32>, std::io::Error> {
    use std::fs::File;
    use std::io::{BufRead, BufReader};

    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let mut numbers = Vec::new();

    for line in reader.lines() {
        let line = line?;
        if let Ok(num) = line.trim().parse::<i32>() {
            numbers.push(num);
        }
    }

    Ok(numbers)
} // needs a little more refinement but its fine

fn write_to_file(path: &str, numbers: &[i32]) -> Result<(), std::io::Error> {
    use std::fs::File;
    use std::io::Write;

    let mut file = File::create(path)?;

    for num in numbers {
        writeln!(file, "{}", num)?;
    }

    Ok(())
}