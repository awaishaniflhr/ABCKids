import ScreenContainer from '../components/ScreenContainer';
import React, { useState } from 'react';
import { View, Text, Button, TouchableOpacity, StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  row: {
    flexDirection: 'row'
  },
  cell: {
    width: 100,
    height: 100,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonText: {
    fontSize: 36,
    color: '#000'
  }
});
const TicTacToe = () => {
  const [board, setBoard] = useState(Array(9).fill(''));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState('');
  const handlePress = index => {
    if (board[index] === '' && winner === '') {
      const newBoard = [...board];
      newBoard[index] = currentPlayer;
      setBoard(newBoard);
      const newPlayer = currentPlayer === 'X' ? 'O' : 'X';
      setCurrentPlayer(newPlayer);
      checkWinner(newBoard);
    }
  };
  const checkWinner = board => {
    const winningCombos = [[0, 1, 2], [3, 4, 5], [6, 7, 8],
    // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    // columns
    [0, 4, 8], [2, 4, 6] // diagonals
    ];
    for (let combo of winningCombos) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        setWinner(board[a]);
        break;
      }
    }
  };
  const resetGame = () => {
    setBoard(Array(9).fill(''));
    setCurrentPlayer('X');
    setWinner('');
  };
  return <ScreenContainer style={styles.container}>
      {board.map((cell, index) => <TouchableOpacity key={index} style={styles.cell} onPress={() => handlePress(index)}>
          <Text style={styles.buttonText}>{cell}</Text>
        </TouchableOpacity>)}
      {winner ? <View>
          <Text>{`Player ${winner} wins!`}</Text>
          <Button title="Reset Game" onPress={resetGame} />
        </View> : <Text>{`Current Player: ${currentPlayer}`}</Text>}
    </ScreenContainer>;
};
export default TicTacToe;
