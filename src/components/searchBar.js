// components/SearchBar.jsx
import React from 'react';
import { Box, TextField, MenuItem, Typography, Button } from '@mui/material';

const SearchBar = ({
  name, setName,
  selectedSpecialty, setSelectedSpecialty,
  selectedCity, setSelectedCity,
  specialties, cities,
  handleSearch,
}) => {
  return (
    <Box
      component="form"
      onSubmit={handleSearch}
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        p: 2,
        bgcolor: 'white',
        borderRadius: 3,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        alignItems: 'stretch',
        flexWrap: 'wrap',
      }}
    >
      {/* Nom */}
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', letterSpacing: 1, color: 'gray.500', ml: 0.5, mt: 0.5 }}>
          Qui recherchez-vous ?
        </Typography>
        <TextField
          placeholder="Ex: Maître Durand..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          variant="standard"
          fullWidth
          InputProps={{
            disableUnderline: true,
            sx: { px: 2, py: 1.5, bgcolor: 'transparent', color: 'text.primary', fontSize: '0.875rem', fontWeight: 500, '&::placeholder': { color: 'gray.400' } }
          }}
        />
      </Box>

      {/* Separator */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, width: '1px', bgcolor: 'grey.200', my: 1 }} />

      {/* Spécialité */}
      <Box sx={{ flex: 1, minWidth: 150 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', letterSpacing: 1, color: 'gray.500', ml: 0.5, mt: 0.5 }}>
          Spécialité
        </Typography>
        <TextField
          select
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          variant="standard"
          fullWidth
          InputProps={{ disableUnderline: true, sx: { px: 2, py: 1.5, bgcolor: 'transparent', color: 'text.primary', fontSize: '0.875rem', fontWeight: 500 } }}
        >
          {specialties.map(s => (
            <MenuItem key={s.key} value={s.key}>{s.label}</MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Separator */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, width: '1px', bgcolor: 'grey.200', my: 1 }} />

      {/* Ville */}
      <Box sx={{ flex: 1, minWidth: 150 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', letterSpacing: 1, color: 'gray.500', ml: 0.5, mt: 0.5 }}>
          Où ?
        </Typography>
        <TextField
          select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          variant="standard"
          fullWidth
          InputProps={{ disableUnderline: true, sx: { px: 2, py: 1.5, bgcolor: 'transparent', color: 'text.primary', fontSize: '0.875rem', fontWeight: 500 } }}
        >
          {cities.map(c => (
            <MenuItem key={c.key} value={c.key}>{c.label}</MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Bouton */}
      <Button
        type="submit"
        sx={{
          bgcolor: '#2563eb',
          color: 'white',
          fontWeight: 'bold',
          py: 1.5,
          px: 4,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          textTransform: 'none',
          transition: 'all 0.2s',
          '&:hover': { bgcolor: '#1e40af', transform: 'scale(1.02)' },
          '&:active': { transform: 'scale(0.98)' },
          minWidth: { xs: '100%', md: 'auto' },
        }}
      >
        Rechercher
      </Button>
    </Box>
  );
};

export default SearchBar;
