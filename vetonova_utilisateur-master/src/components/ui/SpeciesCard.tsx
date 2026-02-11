import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Dog, Cat, Bird, Rabbit, PawPrint } from 'lucide-react-native';

interface SpeciesCardProps {
  type: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  selected?: boolean; // Changé en boolean pour plus de simplicité
  onSelect: () => void;
}

export const SpeciesCard: React.FC<SpeciesCardProps> = ({ type, selected, onSelect }) => {
  // Sélection de l'icône Lucide
  const IconComponent = () => {
    const size = 28;
    const color = selected ? '#fff' : '#6366f1';
    
    switch (type) {
      case 'dog': return <Dog size={size} color={color} />;
      case 'cat': return <Cat size={size} color={color} />;
      case 'bird': return <Bird size={size} color={color} />;
      case 'rabbit': return <Rabbit size={size} color={color} />;
      default: return <PawPrint size={size} color={color} />;
    }
  };

  const labels = {
    dog: 'Chien',
    cat: 'Chat',
    bird: 'Oiseau',
    rabbit: 'Lapin',
    other: 'Autre'
  };

  return (
    <TouchableOpacity 
      onPress={onSelect}
      activeOpacity={0.7}
      style={[
        styles.card, 
        selected ? styles.cardSelected : styles.cardUnselected
      ]}
    >
      <View style={[styles.iconContainer, selected && styles.iconContainerSelected]}>
        <IconComponent />
      </View>
      <Text style={[styles.text, selected ? styles.textSelected : styles.textUnselected]}>
        {labels[type]}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 85,
    height: 110,
    borderRadius: 24,
    marginRight: 15,
    // Ombre douce
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardUnselected: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardSelected: {
    backgroundColor: '#6366f1', // Couleur primaire
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainerSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
  textUnselected: {
    color: '#64748b',
  },
  textSelected: {
    color: '#fff',
  },
});