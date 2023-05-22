const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Create Express app
const app = express();

// Middleware
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/movies', { useNewUrlParser: true });

// Define schemas
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    genre: { type: String, required: true },
    year: { type: Number, required: true },
    director: { type: String, required: true },
    description: { type: String }
});

// Define models
const User = mongoose.model('User', userSchema);
const Movie = mongoose.model('Movie', movieSchema);

// Routes
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ username }, 'secret', { expiresIn: '1h' });

    res.json({ token });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
        res.status(401).json({ message: 'Invalid username or password.' });
        return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        res.status(401).json({ message: 'Invalid username or password.' });
        return;
    }

    const token = jwt.sign({ username }, 'secret', { expiresIn: '1h' });

    res.json({ token });
});

app.use(auth);

app.get('/movies', async (req, res) => {
    const movies = await Movie.find();
    res.json(movies);
});

app.get('/movies/:id', async (req, res) => {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
        res.status(404).json({ message: 'Movie not found.' });
        return;
    }

    res.json(movie);
});

app.post('/movies', async (req, res) => {
    const { title, genre, year, director, description } = req.body;

    const newMovie = new Movie({ title, genre, year, director, description });
    await newMovie.save();

    res.json({ message: 'Movie added successfully.' });
});

app.put('/movies/:id', async (req, res) => {
    const { title, genre, year, director, description } = req.body;

    const movie = await Movie.findById(req.params.id);
    if (!movie) {
        res.status(404).json({ message: 'Movie not found.' });
        return;
    }

    movie.title = title;
    movie.genre = genre;
    movie.year = year;
    movie.director = director;
    movie.description = description;

    await movie.save();

    res.json({ message: 'Movie updated successfully.' });
});

app.delete('/movies/:id', async (req, res) => {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
        res.status(404).json({ message: 'Movie not found.' });
    return;
}

await movie.remove();

res.json({ message: 'Movie deleted successfully.' });
});


function auth(req, res, next) {
const token = req.headers.authorization;
if (!token) {
res.status(401).json({ message: 'Unauthorized.' });
return;
}
jwt.verify(token, 'secret', (err, decoded) => {
    if (err) {
        res.status(401).json({ message: 'Unauthorized.' });
        return;
    }

    req.user = decoded.username;
    next();
});
}

app.listen(3000, () => console.log('Server started on port 3000.'));
